import { motion } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import { ProxyState, useProxyStatus } from '../../../hooks/useProxyStatus';

interface ProxyControlProps {
    onOpenSettings: () => void;
}

const STATE_META: Record<ProxyState, { label: string; button: string; dot: string; icon: React.ElementType }> = {
    connected: {
        label: 'Proxy connected',
        button: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300 shadow-[0_8px_30px_rgba(16,185,129,0.18)]',
        dot: 'bg-emerald-400',
        icon: ShieldCheck,
    },
    connecting: {
        label: 'Proxy connecting',
        button: 'border-amber-400/40 bg-amber-500/15 text-amber-300 shadow-[0_8px_30px_rgba(245,158,11,0.16)]',
        dot: 'bg-amber-400',
        icon: Loader2,
    },
    error: {
        label: 'Proxy error',
        button: 'border-red-400/40 bg-red-500/15 text-red-300 shadow-[0_8px_30px_rgba(239,68,68,0.16)]',
        dot: 'bg-red-400',
        icon: ShieldAlert,
    },
    disabled: {
        label: 'Proxy off',
        button: 'border-telegram-border bg-telegram-surface/90 text-telegram-subtext shadow-[0_8px_30px_rgba(0,0,0,0.18)]',
        dot: 'bg-telegram-subtext/50',
        icon: ShieldOff,
    },
};

export function ProxyControl({ onOpenSettings }: ProxyControlProps) {
    const { settings } = useSettings();
    const { state, enabled, configured } = useProxyStatus();
    const activeProxy = settings.proxyProfiles.find(proxy => proxy.id === settings.selectedProxyId) || null;
    const meta = enabled && configured ? STATE_META[state] : STATE_META.disabled;
    const Icon = configured ? meta.icon : Shield;
    const spin = state === 'connecting' && enabled && configured;
    const serverLabel = activeProxy?.name || (configured ? `${settings.proxyHost}:${settings.proxyPort}` : '');
    const label = serverLabel && enabled ? `${meta.label}: ${serverLabel}` : meta.label;

    return (
        <motion.button
            type="button"
            onClick={onOpenSettings}
            title={label}
            aria-label={label}
            initial={false}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className={`group fixed right-5 bottom-5 z-40 flex items-center justify-center w-12 h-12 rounded-full border backdrop-blur-xl transition-colors ${meta.button}`}
        >
            <Icon className={`w-5 h-5 ${spin ? 'animate-spin' : ''}`} />
            <span
                className={`absolute right-1.5 top-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-telegram-surface ${meta.dot} ${spin ? 'animate-pulse' : ''}`}
            />
            <span className="pointer-events-none absolute right-full mr-2 max-w-56 rounded-lg border border-telegram-border bg-telegram-elevated px-2.5 py-1.5 text-xs text-telegram-text opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap">
                {serverLabel || 'Proxy settings'}
            </span>
        </motion.button>
    );
}
