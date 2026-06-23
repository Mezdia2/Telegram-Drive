import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { load } from '@tauri-apps/plugin-store';
import { SupportedLanguage } from '../i18n/languages';

export interface ProxyProfile {
    id: string;
    name: string;
    type: 'socks5' | 'http' | 'https';
    host: string;
    port: number;
    username: string;
    password: string;
}

export interface Settings {
    viewMode: 'grid' | 'list';
    sidebarCollapsed: boolean;
    autoUpdate: boolean;
    maxConcurrentUploads: number;
    maxConcurrentDownloads: number;
    zipFolders: boolean;
    language: SupportedLanguage;

    // ── Proxy ──────────────────────────────────────────────
    proxyEnabled: boolean;
    proxyType: 'socks5' | 'http' | 'https';
    proxyHost: string;
    proxyPort: number;
    proxyUsername: string;
    proxyPassword: string;   // SOCKS5
    proxyProfiles: ProxyProfile[];
    selectedProxyId: string | null;

    // ── VPN Optimizer (master toggle) ─────────────────────
    vpnMode: boolean;

    // Individual controls (active only when vpnMode = true)
    timeoutMultiplier: number;       // 1–5
    retryAttempts: number;           // 0–5
    retryBaseBackoffSec: number;     // 0.5–5
    retryMaxBackoffSec: number;      // 8–60
    adaptivePolling: boolean;
    pollingMinSec: number;           // 10–30
    pollingMaxSec: number;           // 45–120
    preferredDC: 'auto' | 'dc1' | 'dc2' | 'dc3' | 'dc4' | 'dc5';
    dcFallbackAttempts: number;      // 1–4
    floodWaitRespect: boolean;
    peerCacheSize: number;           // 100–2000
    bandwidthLimitUpKBs: number;     // 0 = unlimited, KB/s
    bandwidthLimitDownKBs: number;   // 0 = unlimited, KB/s
    chunkSizeKb: number;             // 128, 256, 512
    keepAliveIntervalSec: number;    // 0 = disabled, 30–120
    autoDetectVpn: boolean;
    archiveMaxBytes: number;           // 0 = unlimited, MiB for bulk archive (API)

    // ── Performance ────────────────────────────────────────
    performanceMode: boolean;        // Disable blur, shadows, and heavy animations
    linuxRenderingFix: boolean;      // WEBKIT_DISABLE_DMABUF_RENDERER=1 (Linux only, restart required)

    // ── Transcode cache ─────────────────────────────────────
    transcodeCacheMaxGb: number;     // 1–50 GB, default 5
}

const defaultSettings: Settings = {
    viewMode: 'grid',
    sidebarCollapsed: true,
    autoUpdate: true,
    maxConcurrentUploads: 6,
    maxConcurrentDownloads: 6,
    zipFolders: true,
    language: 'en',

    // Proxy — off by default
    proxyEnabled: false,
    proxyType: 'socks5',
    proxyHost: '',
    proxyPort: 1080,
    proxyUsername: '',
    proxyPassword: '',
    proxyProfiles: [],
    selectedProxyId: null,

    // VPN Optimizer — off by default (preserves existing behaviour)
    vpnMode: false,
    timeoutMultiplier: 3,
    retryAttempts: 3,
    retryBaseBackoffSec: 1,
    retryMaxBackoffSec: 30,
    adaptivePolling: true,
    pollingMinSec: 15,
    pollingMaxSec: 60,
    preferredDC: 'auto',
    dcFallbackAttempts: 2,
    floodWaitRespect: true,
    peerCacheSize: 500,
    bandwidthLimitUpKBs: 0,
    bandwidthLimitDownKBs: 0,
    chunkSizeKb: 512,
    keepAliveIntervalSec: 0,
    autoDetectVpn: false,
    archiveMaxBytes: 256,  // 256 MiB

    performanceMode: false,
    linuxRenderingFix: true,

    transcodeCacheMaxGb: 5,
};

interface SettingsContextType {
    settings: Settings;
    updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
    updateSettings: (patch: Partial<Settings> | ((prev: Settings) => Partial<Settings>)) => void;
    resetSettings: () => void;
    isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function normalizeProxyType(value: unknown): ProxyProfile['type'] {
    return value === 'http' || value === 'https' || value === 'socks5' ? value : 'socks5';
}

function normalizeProxyPort(value: unknown, fallback = 1080) {
    const port = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(port)) return fallback;
    return Math.max(1, Math.min(65535, Math.round(port)));
}

function proxyDisplayName(type: ProxyProfile['type'], host: string, port: number) {
    return `${type.toUpperCase()} ${host}:${port}`;
}

function normalizeProxyProfile(raw: Partial<ProxyProfile>, index: number): ProxyProfile | null {
    const host = typeof raw.host === 'string' ? raw.host.trim() : '';
    if (!host) return null;
    const type = normalizeProxyType(raw.type);
    const port = normalizeProxyPort(raw.port);
    return {
        id: raw.id || `proxy-${Date.now()}-${index}`,
        name: (raw.name || proxyDisplayName(type, host, port)).trim(),
        type,
        host,
        port,
        username: raw.username || '',
        password: raw.password || '',
    };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load settings from Tauri store on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const store = await load('settings.json');
                const saved = await store.get<Settings>('settings');
                if (saved) {
                    // Merge with defaults so new keys are always present
                    const merged = { ...defaultSettings, ...saved };
                    // Backward compat: map old 'mtproto' proxyType to 'socks5'
                    if ((merged.proxyType as string) === 'mtproto') {
                        merged.proxyType = 'socks5';
                    }
                    merged.proxyType = normalizeProxyType(merged.proxyType);
                    merged.proxyPort = normalizeProxyPort(merged.proxyPort);

                    const savedProfiles = Array.isArray((saved as Partial<Settings>).proxyProfiles)
                        ? (saved as Partial<Settings>).proxyProfiles || []
                        : [];
                    const profiles = savedProfiles
                        .map((profile, index) => normalizeProxyProfile(profile, index))
                        .filter((profile): profile is ProxyProfile => Boolean(profile));

                    if (profiles.length === 0 && merged.proxyHost.trim()) {
                        profiles.push({
                            id: 'legacy-proxy',
                            name: proxyDisplayName(merged.proxyType, merged.proxyHost.trim(), merged.proxyPort),
                            type: merged.proxyType,
                            host: merged.proxyHost.trim(),
                            port: merged.proxyPort,
                            username: merged.proxyUsername,
                            password: merged.proxyPassword,
                        });
                    }

                    merged.proxyProfiles = profiles;
                    merged.selectedProxyId = profiles.some(profile => profile.id === merged.selectedProxyId)
                        ? merged.selectedProxyId
                        : profiles[0]?.id || null;

                    const activeProxy = profiles.find(profile => profile.id === merged.selectedProxyId);
                    if (activeProxy) {
                        merged.proxyType = activeProxy.type;
                        merged.proxyHost = activeProxy.host;
                        merged.proxyPort = activeProxy.port;
                        merged.proxyUsername = activeProxy.username;
                        merged.proxyPassword = activeProxy.password;
                    } else {
                        merged.proxyEnabled = false;
                        merged.proxyHost = '';
                        merged.proxyUsername = '';
                        merged.proxyPassword = '';
                    }
                    setSettings(merged);
                }
            } catch {
                // Store not available or first run — use defaults
            } finally {
                setIsLoaded(true);
            }
        };
        loadSettings();
    }, []);

    const persistSettings = useCallback(async (next: Settings) => {
        try {
            const store = await load('settings.json');
            await store.set('settings', next);
            await store.save();
        } catch {
            // best-effort persistence
        }
    }, []);

    const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
        setSettings(prev => {
            const next = { ...prev, [key]: value };
            persistSettings(next);
            return next;
        });
    }, [persistSettings]);

    const updateSettings = useCallback((patch: Partial<Settings> | ((prev: Settings) => Partial<Settings>)) => {
        setSettings(prev => {
            const patchValue = typeof patch === 'function' ? patch(prev) : patch;
            const next = { ...prev, ...patchValue };
            persistSettings(next);
            return next;
        });
    }, [persistSettings]);

    const resetSettings = useCallback(() => {
        setSettings(defaultSettings);
        persistSettings(defaultSettings);
    }, [persistSettings]);

    return (
        <SettingsContext.Provider value={{ settings, updateSetting, updateSettings, resetSettings, isLoaded }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error('useSettings must be used within a SettingsProvider');
    return context;
};
