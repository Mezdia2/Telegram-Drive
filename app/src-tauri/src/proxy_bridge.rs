//! Proxy bridge.
//!
//! The Telegram transport (grammers) can only dial `socks5://` proxies. To let
//! users route Telegram traffic through an HTTP or HTTPS (CONNECT) proxy, this
//! module runs a tiny local SOCKS5 listener on `127.0.0.1`. grammers connects to
//! that listener; for every connection we open a tunnel to the upstream HTTP(S)
//! proxy using the `CONNECT` method and splice the two together.
//!
//! It also exposes a one-shot `tunnel_connect` used to probe live reachability
//! for any proxy type (socks5/http/https), which drives the UI connection state.

use std::pin::Pin;
use std::sync::Arc;
use std::task::{Context, Poll};

use base64::Engine as _;
use base64::engine::general_purpose::STANDARD as BASE64;
use tokio::io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt, ReadBuf};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::oneshot;

use crate::vpn_optimizer::ProxyConfig;

/// Live connection state surfaced to the UI.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProxyStatus {
    Disabled,
    Connecting,
    Connected,
    Error,
}

impl ProxyStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            ProxyStatus::Disabled => "disabled",
            ProxyStatus::Connecting => "connecting",
            ProxyStatus::Connected => "connected",
            ProxyStatus::Error => "error",
        }
    }
}

/// An upstream connection that may or may not be wrapped in TLS.
/// Implements `AsyncRead`/`AsyncWrite` by delegating to the active variant so it
/// can be spliced with `copy_bidirectional`.
pub enum Upstream {
    Plain(TcpStream),
    Tls(Box<tokio_rustls::client::TlsStream<TcpStream>>),
}

impl AsyncRead for Upstream {
    fn poll_read(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &mut ReadBuf<'_>,
    ) -> Poll<std::io::Result<()>> {
        match self.get_mut() {
            Upstream::Plain(s) => Pin::new(s).poll_read(cx, buf),
            Upstream::Tls(s) => Pin::new(&mut **s).poll_read(cx, buf),
        }
    }
}

impl AsyncWrite for Upstream {
    fn poll_write(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &[u8],
    ) -> Poll<std::io::Result<usize>> {
        match self.get_mut() {
            Upstream::Plain(s) => Pin::new(s).poll_write(cx, buf),
            Upstream::Tls(s) => Pin::new(&mut **s).poll_write(cx, buf),
        }
    }

    fn poll_flush(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<std::io::Result<()>> {
        match self.get_mut() {
            Upstream::Plain(s) => Pin::new(s).poll_flush(cx),
            Upstream::Tls(s) => Pin::new(&mut **s).poll_flush(cx),
        }
    }

    fn poll_shutdown(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<std::io::Result<()>> {
        match self.get_mut() {
            Upstream::Plain(s) => Pin::new(s).poll_shutdown(cx),
            Upstream::Tls(s) => Pin::new(&mut **s).poll_shutdown(cx),
        }
    }
}

/// Build a unique signature for a proxy config so we can detect changes and
/// avoid restarting an identical bridge.
fn proxy_signature(p: &ProxyConfig) -> String {
    format!(
        "{}|{}|{}|{}|{}|{}",
        p.enabled, p.proxy_type, p.host, p.port, p.username, p.password
    )
}

/// Open a tunnel to `target_host:target_port` through the configured proxy.
/// Works for `socks5`, `http`, and `https` proxy types. The returned stream is
/// already past the proxy handshake and carries raw bytes to the target.
pub async fn tunnel_connect(
    proxy: &ProxyConfig,
    target_host: &str,
    target_port: u16,
) -> Result<Upstream, String> {
    match proxy.proxy_type.as_str() {
        "http" | "https" => connect_via_http(proxy, target_host, target_port).await,
        "socks5" => connect_via_socks5(proxy, target_host, target_port).await,
        other => Err(format!("Unsupported proxy type: {}", other)),
    }
}

/// Tunnel through an HTTP or HTTPS (CONNECT) proxy.
async fn connect_via_http(
    proxy: &ProxyConfig,
    target_host: &str,
    target_port: u16,
) -> Result<Upstream, String> {
    let tcp = TcpStream::connect((proxy.host.as_str(), proxy.port))
        .await
        .map_err(|e| format!("Failed to reach proxy {}:{}: {}", proxy.host, proxy.port, e))?;
    let _ = tcp.set_nodelay(true);

    let mut stream: Upstream = if proxy.proxy_type == "https" {
        let tls = wrap_tls(tcp, &proxy.host).await?;
        Upstream::Tls(Box::new(tls))
    } else {
        Upstream::Plain(tcp)
    };

    // Build and send the CONNECT request.
    let mut req = format!(
        "CONNECT {host}:{port} HTTP/1.1\r\nHost: {host}:{port}\r\n",
        host = target_host,
        port = target_port
    );
    if !proxy.username.is_empty() {
        let token = BASE64.encode(format!("{}:{}", proxy.username, proxy.password));
        req.push_str(&format!("Proxy-Authorization: Basic {}\r\n", token));
    }
    req.push_str("Proxy-Connection: Keep-Alive\r\n\r\n");

    stream
        .write_all(req.as_bytes())
        .await
        .map_err(|e| format!("Failed to send CONNECT: {}", e))?;
    stream
        .flush()
        .await
        .map_err(|e| format!("Failed to flush CONNECT: {}", e))?;

    // Read the response headers up to the terminating blank line, one byte at a
    // time so we never consume tunnel payload that follows.
    let status_line = read_http_status_line(&mut stream).await?;
    // Expected: "HTTP/1.1 200 Connection established"
    let ok = status_line
        .split_whitespace()
        .nth(1)
        .map(|code| code == "200")
        .unwrap_or(false);
    if !ok {
        return Err(format!("Proxy refused CONNECT: {}", status_line.trim()));
    }

    Ok(stream)
}

/// Read until the HTTP header terminator (\r\n\r\n) and return the status line.
async fn read_http_status_line(stream: &mut Upstream) -> Result<String, String> {
    let mut buf: Vec<u8> = Vec::with_capacity(256);
    let mut byte = [0u8; 1];
    loop {
        let n = stream
            .read(&mut byte)
            .await
            .map_err(|e| format!("Failed reading proxy response: {}", e))?;
        if n == 0 {
            return Err("Proxy closed connection during CONNECT".into());
        }
        buf.push(byte[0]);
        if buf.len() >= 4 && &buf[buf.len() - 4..] == b"\r\n\r\n" {
            break;
        }
        if buf.len() > 8192 {
            return Err("Proxy response headers too large".into());
        }
    }
    let text = String::from_utf8_lossy(&buf);
    Ok(text.lines().next().unwrap_or("").to_string())
}

/// Wrap a TCP stream in TLS for talking to an HTTPS proxy.
async fn wrap_tls(
    tcp: TcpStream,
    server_name: &str,
) -> Result<tokio_rustls::client::TlsStream<TcpStream>, String> {
    use tokio_rustls::rustls::crypto::ring;
    use tokio_rustls::rustls::pki_types::ServerName;
    use tokio_rustls::rustls::{ClientConfig, RootCertStore};
    use tokio_rustls::TlsConnector;

    let mut roots = RootCertStore::empty();
    roots.extend(webpki_roots::TLS_SERVER_ROOTS.iter().cloned());

    // Build with an explicit crypto provider so we never depend on a process-wide
    // default being installed (which would otherwise panic at runtime).
    let config = ClientConfig::builder_with_provider(Arc::new(ring::default_provider()))
        .with_safe_default_protocol_versions()
        .map_err(|e| format!("TLS provider init failed: {}", e))?
        .with_root_certificates(roots)
        .with_no_client_auth();
    let connector = TlsConnector::from(Arc::new(config));

    let domain = ServerName::try_from(server_name.to_string())
        .map_err(|_| format!("Invalid proxy host for TLS: {}", server_name))?;

    connector
        .connect(domain, tcp)
        .await
        .map_err(|e| format!("TLS handshake with proxy failed: {}", e))
}

/// Minimal SOCKS5 client handshake to an upstream SOCKS5 proxy. Only used by the
/// reachability probe; live socks5 traffic is handled by grammers directly.
async fn connect_via_socks5(
    proxy: &ProxyConfig,
    target_host: &str,
    target_port: u16,
) -> Result<Upstream, String> {
    let mut tcp = TcpStream::connect((proxy.host.as_str(), proxy.port))
        .await
        .map_err(|e| format!("Failed to reach proxy {}:{}: {}", proxy.host, proxy.port, e))?;
    let _ = tcp.set_nodelay(true);

    let use_auth = !proxy.username.is_empty();
    // Greeting: version 5, advertise no-auth and (optionally) user/pass.
    if use_auth {
        tcp.write_all(&[0x05, 0x02, 0x00, 0x02]).await
    } else {
        tcp.write_all(&[0x05, 0x01, 0x00]).await
    }
    .map_err(|e| format!("SOCKS5 greeting failed: {}", e))?;

    let mut method = [0u8; 2];
    tcp.read_exact(&mut method)
        .await
        .map_err(|e| format!("SOCKS5 method read failed: {}", e))?;
    if method[0] != 0x05 {
        return Err("Upstream is not a SOCKS5 proxy".into());
    }
    match method[1] {
        0x00 => { /* no auth */ }
        0x02 => {
            if !use_auth {
                return Err("Proxy requires authentication".into());
            }
            // Username/password sub-negotiation (RFC 1929).
            let mut sub = Vec::with_capacity(3 + proxy.username.len() + proxy.password.len());
            sub.push(0x01);
            sub.push(proxy.username.len() as u8);
            sub.extend_from_slice(proxy.username.as_bytes());
            sub.push(proxy.password.len() as u8);
            sub.extend_from_slice(proxy.password.as_bytes());
            tcp.write_all(&sub)
                .await
                .map_err(|e| format!("SOCKS5 auth failed: {}", e))?;
            let mut resp = [0u8; 2];
            tcp.read_exact(&mut resp)
                .await
                .map_err(|e| format!("SOCKS5 auth response failed: {}", e))?;
            if resp[1] != 0x00 {
                return Err("SOCKS5 authentication rejected".into());
            }
        }
        0xFF => return Err("Proxy rejected all authentication methods".into()),
        _ => return Err("Proxy selected an unsupported auth method".into()),
    }

    // CONNECT request.
    let mut req = vec![0x05, 0x01, 0x00];
    encode_socks_addr(&mut req, target_host, target_port);
    tcp.write_all(&req)
        .await
        .map_err(|e| format!("SOCKS5 CONNECT failed: {}", e))?;

    // Reply: VER REP RSV ATYP ... — read header then discard the bound address.
    let mut head = [0u8; 4];
    tcp.read_exact(&mut head)
        .await
        .map_err(|e| format!("SOCKS5 reply failed: {}", e))?;
    if head[1] != 0x00 {
        return Err(format!("SOCKS5 proxy refused connection (code {})", head[1]));
    }
    let skip = match head[3] {
        0x01 => 4,
        0x04 => 16,
        0x03 => {
            let mut len = [0u8; 1];
            tcp.read_exact(&mut len)
                .await
                .map_err(|e| format!("SOCKS5 reply addr failed: {}", e))?;
            len[0] as usize
        }
        _ => return Err("SOCKS5 reply used an unknown address type".into()),
    };
    let mut discard = vec![0u8; skip + 2]; // address + 2-byte port
    tcp.read_exact(&mut discard)
        .await
        .map_err(|e| format!("SOCKS5 reply tail failed: {}", e))?;

    Ok(Upstream::Plain(tcp))
}

/// Append a SOCKS5 address (IPv4 if it parses, else a domain) plus port.
fn encode_socks_addr(buf: &mut Vec<u8>, host: &str, port: u16) {
    if let Ok(ip) = host.parse::<std::net::Ipv4Addr>() {
        buf.push(0x01);
        buf.extend_from_slice(&ip.octets());
    } else {
        buf.push(0x03);
        buf.push(host.len() as u8);
        buf.extend_from_slice(host.as_bytes());
    }
    buf.extend_from_slice(&port.to_be_bytes());
}

// ── Local SOCKS5 listener that fronts an HTTP(S) proxy ──────────────────────

struct BridgeInner {
    port: Option<u16>,
    shutdown: Option<oneshot::Sender<()>>,
    signature: String,
}

/// Managed Tauri state holding the running bridge (if any) and live status.
pub struct ProxyBridgeState {
    inner: std::sync::Mutex<BridgeInner>,
    status: Arc<std::sync::RwLock<ProxyStatus>>,
}

impl ProxyBridgeState {
    pub fn new() -> Self {
        Self {
            inner: std::sync::Mutex::new(BridgeInner {
                port: None,
                shutdown: None,
                signature: String::new(),
            }),
            status: Arc::new(std::sync::RwLock::new(ProxyStatus::Disabled)),
        }
    }

    pub fn status_str(&self) -> String {
        self.status.read().unwrap().as_str().to_string()
    }

    pub fn set_status(&self, status: ProxyStatus) {
        *self.status.write().unwrap() = status;
    }

    /// Stop the running bridge, if any.
    pub fn stop(&self) {
        let mut inner = self.inner.lock().unwrap();
        if let Some(tx) = inner.shutdown.take() {
            let _ = tx.send(());
        }
        inner.port = None;
        inner.signature.clear();
    }

    /// Ensure a local SOCKS5 bridge is running for the given HTTP(S) proxy and
    /// return the local port grammers should dial. Reuses an identical running
    /// bridge instead of restarting it.
    pub async fn ensure_started(&self, proxy: &ProxyConfig) -> Result<u16, String> {
        let signature = proxy_signature(proxy);

        // Fast path: identical bridge already listening.
        {
            let inner = self.inner.lock().unwrap();
            if inner.signature == signature {
                if let Some(port) = inner.port {
                    return Ok(port);
                }
            }
        }

        // Tear down any previous bridge before starting a new one.
        {
            let mut inner = self.inner.lock().unwrap();
            if let Some(tx) = inner.shutdown.take() {
                let _ = tx.send(());
            }
            inner.port = None;
        }

        let listener = TcpListener::bind(("127.0.0.1", 0))
            .await
            .map_err(|e| format!("Failed to start local proxy bridge: {}", e))?;
        let port = listener
            .local_addr()
            .map_err(|e| format!("Failed to read bridge port: {}", e))?
            .port();

        let (shutdown_tx, shutdown_rx) = oneshot::channel::<()>();
        let proxy = proxy.clone();
        let status = self.status.clone();
        self.set_status(ProxyStatus::Connecting);

        tauri::async_runtime::spawn(async move {
            run_bridge(listener, proxy, status, shutdown_rx).await;
        });

        {
            let mut inner = self.inner.lock().unwrap();
            inner.port = Some(port);
            inner.shutdown = Some(shutdown_tx);
            inner.signature = signature;
        }

        log::info!("Proxy bridge listening on 127.0.0.1:{}", port);
        Ok(port)
    }
}

/// Accept loop for the local SOCKS5 bridge.
async fn run_bridge(
    listener: TcpListener,
    proxy: ProxyConfig,
    status: Arc<std::sync::RwLock<ProxyStatus>>,
    mut shutdown: oneshot::Receiver<()>,
) {
    loop {
        tokio::select! {
            _ = &mut shutdown => {
                log::info!("Proxy bridge shutting down");
                break;
            }
            accept = listener.accept() => {
                match accept {
                    Ok((inbound, _)) => {
                        let proxy = proxy.clone();
                        let status = status.clone();
                        tokio::spawn(async move {
                            if let Err(e) = handle_socks_client(inbound, &proxy, &status).await {
                                log::warn!("Proxy bridge connection failed: {}", e);
                                *status.write().unwrap() = ProxyStatus::Error;
                            }
                        });
                    }
                    Err(e) => {
                        log::warn!("Proxy bridge accept error: {}", e);
                    }
                }
            }
        }
    }
}

/// Serve a single SOCKS5 client (grammers), tunnel it through the HTTP(S) proxy.
async fn handle_socks_client(
    mut inbound: TcpStream,
    proxy: &ProxyConfig,
    status: &Arc<std::sync::RwLock<ProxyStatus>>,
) -> Result<(), String> {
    let _ = inbound.set_nodelay(true);

    // Greeting: VER NMETHODS METHODS...
    let mut head = [0u8; 2];
    inbound
        .read_exact(&mut head)
        .await
        .map_err(|e| format!("bridge greeting failed: {}", e))?;
    if head[0] != 0x05 {
        return Err("client is not SOCKS5".into());
    }
    let mut methods = vec![0u8; head[1] as usize];
    inbound
        .read_exact(&mut methods)
        .await
        .map_err(|e| format!("bridge methods read failed: {}", e))?;
    let _ = methods;
    // Always answer "no authentication required".
    inbound
        .write_all(&[0x05, 0x00])
        .await
        .map_err(|e| format!("bridge method reply failed: {}", e))?;

    // Request: VER CMD RSV ATYP DST.ADDR DST.PORT
    let mut reqhead = [0u8; 4];
    inbound
        .read_exact(&mut reqhead)
        .await
        .map_err(|e| format!("bridge request failed: {}", e))?;
    if reqhead[1] != 0x01 {
        // Only CONNECT is supported; reply "command not supported".
        let _ = inbound
            .write_all(&[0x05, 0x07, 0x00, 0x01, 0, 0, 0, 0, 0, 0])
            .await;
        return Err("bridge received unsupported command".into());
    }

    let target_host = match reqhead[3] {
        0x01 => {
            let mut addr = [0u8; 4];
            inbound
                .read_exact(&mut addr)
                .await
                .map_err(|e| format!("bridge addr read failed: {}", e))?;
            std::net::Ipv4Addr::from(addr).to_string()
        }
        0x03 => {
            let mut len = [0u8; 1];
            inbound
                .read_exact(&mut len)
                .await
                .map_err(|e| format!("bridge addr len failed: {}", e))?;
            let mut dom = vec![0u8; len[0] as usize];
            inbound
                .read_exact(&mut dom)
                .await
                .map_err(|e| format!("bridge domain read failed: {}", e))?;
            String::from_utf8_lossy(&dom).to_string()
        }
        0x04 => {
            let mut addr = [0u8; 16];
            inbound
                .read_exact(&mut addr)
                .await
                .map_err(|e| format!("bridge addr6 read failed: {}", e))?;
            std::net::Ipv6Addr::from(addr).to_string()
        }
        _ => {
            let _ = inbound
                .write_all(&[0x05, 0x08, 0x00, 0x01, 0, 0, 0, 0, 0, 0])
                .await;
            return Err("bridge received unknown address type".into());
        }
    };

    let mut portb = [0u8; 2];
    inbound
        .read_exact(&mut portb)
        .await
        .map_err(|e| format!("bridge port read failed: {}", e))?;
    let target_port = u16::from_be_bytes(portb);

    // Open the upstream tunnel.
    let upstream = match connect_via_http(proxy, &target_host, target_port).await {
        Ok(s) => s,
        Err(e) => {
            // Reply "host unreachable".
            let _ = inbound
                .write_all(&[0x05, 0x04, 0x00, 0x01, 0, 0, 0, 0, 0, 0])
                .await;
            return Err(e);
        }
    };

    // Success reply with a dummy bound address.
    inbound
        .write_all(&[0x05, 0x00, 0x00, 0x01, 0, 0, 0, 0, 0, 0])
        .await
        .map_err(|e| format!("bridge success reply failed: {}", e))?;

    *status.write().unwrap() = ProxyStatus::Connected;

    let mut upstream = upstream;
    let _ = tokio::io::copy_bidirectional(&mut inbound, &mut upstream).await;
    Ok(())
}
