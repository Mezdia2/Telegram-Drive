import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSettings } from '../context/SettingsContext';

export type ProxyState = 'disabled' | 'connecting' | 'connected' | 'error';

/**
 * Tracks the live proxy connection state surfaced by the Rust backend and
 * exposes helpers to enable/disable the proxy and re-probe reachability.
 *
 * The backend reports one of: disabled | connecting | connected | error.
 * When the proxy is enabled we actively probe Telegram reachability so the
 * indicator reflects reality rather than just the configured intent.
 */
export function useProxyStatus() {
    const { settings, updateSettings } = useSettings();
    const [state, setState] = useState<ProxyState>('disabled');
    const probingRef = useRef(false);

    const enabled = settings.proxyEnabled;
    const configured = settings.proxyHost.trim().length > 0;

    const refresh = useCallback(async () => {
        try {
            const s = await invoke<string>('cmd_get_proxy_status');
            setState((s as ProxyState) || 'disabled');
        } catch {
            /* backend not ready */
        }
    }, []);

    const probe = useCallback(async () => {
        if (probingRef.current) return;
        probingRef.current = true;
        setState('connecting');
        try {
            const s = await invoke<string>('cmd_probe_proxy');
            setState((s as ProxyState) || 'disabled');
        } catch {
            setState('error');
        } finally {
            probingRef.current = false;
        }
    }, []);

    const applyProxy = useCallback(async (nextEnabled: boolean) => {
        await invoke('cmd_apply_proxy_settings', {
            enabled: nextEnabled,
            proxyType: settings.proxyType,
            host: settings.proxyHost,
            port: settings.proxyPort,
            username: settings.proxyUsername,
            password: settings.proxyPassword,
        });
        try {
            await invoke<boolean>('cmd_reconnect_with_network_settings');
        } catch {
            // The user may be on the auth screen or offline; status probing below
            // still gives immediate feedback for the configured proxy.
        }
    }, [
        settings.proxyType, settings.proxyHost, settings.proxyPort,
        settings.proxyUsername, settings.proxyPassword,
    ]);

    // Toggle the proxy on/off and rebuild the Telegram transport.
    const toggle = useCallback(async () => {
        const next = !enabled;
        updateSettings({ proxyEnabled: next });
        if (!next) {
            setState('disabled');
            await applyProxy(false).catch(() => undefined);
        } else if (configured) {
            setState('connecting');
            await applyProxy(true).catch(() => setState('error'));
            probe();
        }
    }, [enabled, configured, updateSettings, applyProxy, probe]);

    // Probe once when enabled/configured, then poll the cached status.
    useEffect(() => {
        if (!enabled || !configured) {
            setState('disabled');
            return;
        }
        probe();
        const interval = setInterval(refresh, 5000);
        return () => clearInterval(interval);
    }, [enabled, configured, settings.proxyType, settings.proxyHost, settings.proxyPort, probe, refresh]);

    return { state, enabled, configured, probe, refresh, toggle };
}
