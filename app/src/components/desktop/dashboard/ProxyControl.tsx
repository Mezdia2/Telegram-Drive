import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, ShieldCheck, ShieldAlert, ShieldOff, Loader2,
    Settings2, Plus, RefreshCw, Check,
} from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import { useProxyStatus, ProxyState } from '../../../hooks/useProxyStatus';

interface ProxyControlProps {
    onOpenSettings: () => void;
}

const STATE_META: Record<ProxyState, { label: string; dot: string; text: string; icon: React.ElementType }> = {
    connected: { label: 'Connected', dot: 'bg-emerald-400', text: 'text-emerald-400', icon: ShieldCheck },
    connecting: { label: 'Connecting…', dot: 'bg-amber-400', text: 'text-amber-400', icon: Loader2 },
    error: { label: 'Connection failed', dot: 'bg-red-400', text: 'text-red-400', icon: ShieldAlert },
    disabled: { label: 'Disabled', dot: 'bg-telegram-subtext/50', text: 'text-telegram-subtext', icon: ShieldOff },
};

/**
 * Compact, Telegram-style proxy control for the title bar.
 * Shows live connection state and exposes a quick enable/disable toggle, a
 * re-check action, and a shortcut into full proxy settings.
 */
export function ProxyControl({ onOpenSettings }: ProxyControlProps) {
    const { settings } = useSettings();
    const { state, enabled, configured, probe, toggle } = useProxyStatus();
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    // Close popover on outside click / Escape
    useEffect(() => {
        if (!open) return;
        const onDocClick = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        window.addEventListener('mousedown', onDocClick);
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('mousedown', onDocClick);
            window.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const meta = enabled && configured ? STATE_META[state] : STATE_META.disabled;
    const TriggerIcon = enabled && configured ? meta.icon : Shield;
    const spin = state === 'connecting' && enabled && configured;

    return (
        <div ref={rootRef} className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                title="Proxy"
                className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${open ? 'bg-telegram-hover' : 'hover:bg-telegram-hover'} ${enabled && configured ? meta.text : 'text-telegram-subtext hover:text-telegram-text'}`}
            >
                <TriggerIcon className={`w-5 h-5 ${spin ? 'animate-spin' : ''}`} />
                {/* Status dot */}
                {enabled && configured && (
                    <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-telegram-surface ${meta.dot} ${state === 'connecting' ? 'animate-pulse' : ''}`} />
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                        className="absolute right-0 mt-2 w-72 z-[120] origin-top-right rounded-xl border border-telegram-border bg-telegram-surface/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                    >
                        {/* Header / status */}
                        <div className="px-4 py-3 border-b border-telegram-border flex items-center gap-3">
                            <div className={`flex items-center justify-center w-9 h-9 rounded-lg bg-telegram-hover ${meta.text}`}>
                                <meta.icon className={`w-[18px] h-[18px] ${spin ? 'animate-spin' : ''}`} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-telegram-text leading-tight">Proxy</p>
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                                    <span className={`text-xs ${meta.text}`}>{configured ? meta.label : 'Not configured'}</span>
                                </div>
                            </div>
                        </div>

                        {configured ? (
                            <div className="p-2">
                                {/* Connection summary */}
                                <div className="px-2 py-2 flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="text-xs text-telegram-subtext">Server</p>
                                        <p className="text-sm text-telegram-text font-medium truncate">{settings.proxyHost}:{settings.proxyPort}</p>
                                    </div>
                                    <span className="ml-2 flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md bg-telegram-primary/10 text-telegram-primary">
                                        {settings.proxyType}
                                    </span>
                                </div>

                                {/* Enable toggle */}
                                <div className="px-2 py-2 flex items-center justify-between">
                                    <span className="text-sm text-telegram-text">Enable proxy</span>
                                    <button
                                        onClick={() => toggle()}
                                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${enabled ? 'bg-emerald-500' : 'bg-telegram-border'}`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="h-px bg-telegram-border my-1" />

                                <button
                                    onClick={() => probe()}
                                    disabled={!enabled || state === 'connecting'}
                                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-telegram-text hover:bg-telegram-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {state === 'connected'
                                        ? <Check className="w-4 h-4 text-emerald-400" />
                                        : <RefreshCw className={`w-4 h-4 text-telegram-subtext ${state === 'connecting' ? 'animate-spin' : ''}`} />}
                                    Check connection
                                </button>
                                <button
                                    onClick={() => { setOpen(false); onOpenSettings(); }}
                                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-telegram-text hover:bg-telegram-hover transition-colors"
                                >
                                    <Settings2 className="w-4 h-4 text-telegram-subtext" />
                                    Proxy settings
                                </button>
                            </div>
                        ) : (
                            <div className="p-3">
                                <p className="text-xs text-telegram-subtext leading-relaxed mb-3">
                                    Route Telegram traffic through a SOCKS5, HTTP, or HTTPS proxy.
                                </p>
                                <button
                                    onClick={() => { setOpen(false); onOpenSettings(); }}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-telegram-primary/10 text-telegram-primary hover:bg-telegram-primary/20 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add proxy
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
