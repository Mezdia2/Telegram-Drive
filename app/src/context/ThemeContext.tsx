import { createContext, useContext, useState, ReactNode, useLayoutEffect, useCallback } from 'react';

// The light/dark "mode" is the active slot. Each slot is filled by a concrete
// theme (a full palette). The toggle flips between the two assigned slots.
export type ThemeMode = 'light' | 'dark';

export interface ThemeDef {
    /** data-theme attribute value + storage id */
    id: string;
    /** i18n key under `themes.*` for the human label */
    labelKey: string;
    /** Fallback English label if the i18n key is missing */
    label: string;
    /** Which slot this palette belongs to */
    mode: ThemeMode;
}

// The full theme registry. `mode` decides which slot a theme can fill.
export const THEMES: ThemeDef[] = [
    { id: 'telegram-dark', labelKey: 'themes.telegram_dark', label: 'Telegram Dark', mode: 'dark' },
    { id: 'mezdia-dark', labelKey: 'themes.mezdia_dark', label: 'Mezdia Dark', mode: 'dark' },
    { id: 'classic-dark', labelKey: 'themes.classic_dark', label: 'Classic Dark', mode: 'dark' },
    { id: 'telegram-light', labelKey: 'themes.telegram_light', label: 'Telegram Light', mode: 'light' },
    { id: 'mezdia-light', labelKey: 'themes.mezdia_light', label: 'Mezdia Light', mode: 'light' },
    { id: 'classic-light', labelKey: 'themes.classic_light', label: 'Classic Light', mode: 'light' },
];

// Telegram themes are the defaults.
const DEFAULT_DARK = 'telegram-dark';
const DEFAULT_LIGHT = 'telegram-light';

const STORAGE_MODE = 'theme';        // kept as 'theme' for backwards compatibility
const STORAGE_DARK = 'theme-dark';   // which palette fills the dark slot
const STORAGE_LIGHT = 'theme-light'; // which palette fills the light slot

const THEME_COLORS: Record<string, string> = {
    'telegram-dark': '#17212b',
    'telegram-light': '#f1f1f4',
    'mezdia-dark': '#000000',
    'mezdia-light': '#f1f7fe',
    'classic-dark': '#0e1621',
    'classic-light': '#f0f2f5',
};

interface ThemeContextType {
    /** Active slot ('light' | 'dark'). Alias: `theme` (legacy). */
    mode: ThemeMode;
    theme: ThemeMode;
    toggleTheme: () => void;
    setMode: (mode: ThemeMode) => void;
    /** Legacy alias of setMode. */
    setTheme: (mode: ThemeMode) => void;
    /** Theme id assigned to each slot. */
    darkThemeId: string;
    lightThemeId: string;
    setDarkThemeId: (id: string) => void;
    setLightThemeId: (id: string) => void;
    /** The palette currently rendered (the assigned theme for the active slot). */
    activeThemeId: string;
    /** The registry, exposed for the settings UI. */
    themes: ThemeDef[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Safe localStorage read: returns the value or null on any error
function safeTryGet(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

// Safe localStorage write: best-effort, silently ignores errors
function safeTrySet(key: string, value: string): void {
    try {
        localStorage.setItem(key, value);
    } catch {
        // Storage unavailable — theme still works in-memory for this session
    }
}

function isValidTheme(id: string | null, mode: ThemeMode): id is string {
    return !!id && THEMES.some(t => t.id === id && t.mode === mode);
}

// Get initial active mode synchronously to prevent flash
function getInitialMode(): ThemeMode {
    if (typeof window !== 'undefined') {
        const saved = safeTryGet(STORAGE_MODE);
        if (saved === 'light' || saved === 'dark') return saved;
        if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }
    }
    return 'dark';
}

function getInitialDarkId(): string {
    const saved = safeTryGet(STORAGE_DARK);
    return isValidTheme(saved, 'dark') ? saved : DEFAULT_DARK;
}

function getInitialLightId(): string {
    const saved = safeTryGet(STORAGE_LIGHT);
    return isValidTheme(saved, 'light') ? saved : DEFAULT_LIGHT;
}

// Apply the active theme to the DOM: data-theme drives the palette, the
// light/dark class drives the structural light-mode CSS.
function applyTheme(mode: ThemeMode, darkId: string, lightId: string) {
    const root = document.documentElement;
    const activeId = mode === 'light' ? lightId : darkId;
    root.setAttribute('data-theme', activeId);
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
        'content',
        THEME_COLORS[activeId] ?? THEME_COLORS[DEFAULT_DARK],
    );
    if (mode === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
    } else {
        root.classList.add('dark');
        root.classList.remove('light');
    }
}

// Apply immediately on script load (before React hydration) to avoid a flash.
if (typeof window !== 'undefined') {
    applyTheme(getInitialMode(), getInitialDarkId(), getInitialLightId());
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setModeState] = useState<ThemeMode>(getInitialMode);
    const [darkThemeId, setDarkThemeIdState] = useState<string>(getInitialDarkId);
    const [lightThemeId, setLightThemeIdState] = useState<string>(getInitialLightId);

    // Apply synchronously before paint whenever any slot or the mode changes.
    useLayoutEffect(() => {
        applyTheme(mode, darkThemeId, lightThemeId);
        safeTrySet(STORAGE_MODE, mode);
        safeTrySet(STORAGE_DARK, darkThemeId);
        safeTrySet(STORAGE_LIGHT, lightThemeId);
    }, [mode, darkThemeId, lightThemeId]);

    const toggleTheme = useCallback(() => {
        setModeState(m => (m === 'dark' ? 'light' : 'dark'));
    }, []);

    const setMode = useCallback((newMode: ThemeMode) => {
        setModeState(newMode);
    }, []);

    const setDarkThemeId = useCallback((id: string) => {
        if (isValidTheme(id, 'dark')) setDarkThemeIdState(id);
    }, []);

    const setLightThemeId = useCallback((id: string) => {
        if (isValidTheme(id, 'light')) setLightThemeIdState(id);
    }, []);

    const activeThemeId = mode === 'light' ? lightThemeId : darkThemeId;

    return (
        <ThemeContext.Provider
            value={{
                mode,
                theme: mode,
                toggleTheme,
                setMode,
                setTheme: setMode,
                darkThemeId,
                lightThemeId,
                setDarkThemeId,
                setLightThemeId,
                activeThemeId,
                themes: THEMES,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};
