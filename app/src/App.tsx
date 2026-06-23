import React, { useState, useEffect, Suspense } from "react";
import { invoke } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthWizard } from "./components/shared/AuthWizard";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import { UpdateBanner } from "./components/shared/UpdateBanner";
import { useUpdateCheck } from "./hooks/useUpdateCheck";
import { usePlatform } from "./hooks/usePlatform";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import "./App.css";

const DesktopDashboard = React.lazy(() => import("./components/desktop/DesktopDashboard").then(m => ({ default: m.Dashboard })));
// Vite requires a fully static import path for dynamic imports so it can
// perform static analysis and code-splitting. Template literals with
// variables prevent Vite from resolving the module at build time.
const MobileDashboard = React.lazy(() => import("./components/mobile/MobileDashboard.tsx"));

import { Toaster } from "sonner";
import { ConfirmProvider } from "./context/ConfirmContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { SettingsProvider } from "./context/SettingsContext";
import { useSettings } from "./context/SettingsContext";
import { useTranslation } from "react-i18next";

const queryClient = new QueryClient();

type AuthStatus = "loading" | "authenticated" | "unauthenticated";
type StoredAuthCredentials = {
  api_id: string;
  api_hash: string;
};

function AppContent() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [restoreMessage, setRestoreMessage] = useState("");
  const { theme } = useTheme();
  const { available, version, downloading, progress, downloadAndInstall, dismissUpdate } = useUpdateCheck();
  const { isMobile } = usePlatform();
  const { settings, updateSetting, isLoaded } = useSettings();
  const { i18n } = useTranslation();
  const networkIsOnline = useNetworkStatus();

  // Handle active language and RTL direction changes
  useEffect(() => {
    if (!isLoaded) return;
    i18n.changeLanguage(settings.language);
    document.documentElement.lang = settings.language;
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
  }, [settings.language, isLoaded, i18n]);

  // Performance mode: auto-enable when user has prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches && !settings.performanceMode) {
      updateSetting('performanceMode', true);
    }
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches && !settings.performanceMode) {
        updateSetting('performanceMode', true);
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Apply performance-mode class to body (guarded by settings load to avoid flicker)
  useEffect(() => {
    if (!isLoaded) return;
    if (settings.performanceMode) {
      document.body.classList.add('performance-mode');
    } else {
      document.body.classList.remove('performance-mode');
    }
  }, [settings.performanceMode, isLoaded]);

  // On mount: check for a saved session and auto-restore it.
  // This is the SINGLE source of truth for the initial connection.
  // useTelegramConnection (inside Dashboard) no longer calls cmd_connect on mount.
  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const retryLater = () => {
      retryTimer = setTimeout(checkSession, 5000);
    };

    const checkSession = async () => {
      if (cancelled) return;
      if (!isLoaded) return;

      const noProxyConfigured = !settings.proxyEnabled || !settings.proxyHost.trim();

      try {
        const credentials = await invoke<StoredAuthCredentials | null>("cmd_get_auth_credentials");
        const store = await load("config.json");
        const legacySavedId = await store.get<string>("api_id");
        const savedId = credentials?.api_id || legacySavedId;

        if (!savedId) {
          setAuthStatus("unauthenticated");
          return;
        }

        const apiId = parseInt(savedId, 10);
        if (isNaN(apiId)) {
          setAuthStatus("unauthenticated");
          return;
        }

        const networkAvailable = await invoke<boolean>("cmd_is_network_available").catch(() => false);
        if (!networkAvailable) {
          setAuthStatus("unauthenticated");
          setRestoreMessage(noProxyConfigured
            ? "No connection to Telegram. Configure a proxy if Telegram is blocked, then reconnect."
            : "No connection to Telegram. Waiting for connectivity..."
          );
          retryLater();
          return;
        }

        setRestoreMessage("Reconnecting to Telegram...");
        await invoke("cmd_connect", { apiId });

        const ok = await invoke<boolean>("cmd_check_connection");
        if (ok) {
          setAuthStatus("authenticated");
          return;
        }

        setAuthStatus("unauthenticated");
        setRestoreMessage("Unable to verify the saved session. Retrying...");
        retryLater();
      } catch (err) {
        console.warn("Session restore failed, retrying:", err);
        setAuthStatus("unauthenticated");
        setRestoreMessage(noProxyConfigured
          ? "Cannot reach Telegram. Configure a proxy if Telegram is blocked, then reconnect."
          : "Cannot reach Telegram. Retrying..."
        );
        retryLater();
      }
    };

    checkSession();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [isLoaded, settings.proxyEnabled, settings.proxyHost]);

  // Retry immediately when the lightweight network probe flips back online.
  useEffect(() => {
    if (authStatus !== "unauthenticated" || !networkIsOnline || !isLoaded) return;

    const checkSession = async () => {
      try {
        const credentials = await invoke<StoredAuthCredentials | null>("cmd_get_auth_credentials");
        const store = await load("config.json");
        const legacySavedId = await store.get<string>("api_id");
        const savedId = credentials?.api_id || legacySavedId;

        if (!savedId) {
          return;
        }

        const apiId = parseInt(savedId, 10);
        if (isNaN(apiId)) {
          return;
        }

        setRestoreMessage("Reconnecting to Telegram...");
        await invoke("cmd_connect", { apiId });
        const ok = await invoke<boolean>("cmd_check_connection");
        if (ok) setAuthStatus("authenticated");
      } catch (err) {
        console.warn("Reconnect attempt failed:", err);
      }
    };

    checkSession();
  }, [authStatus, networkIsOnline, isLoaded]);

  // Clean up PDF preview cache files on close/beforeunload
  useEffect(() => {
    const handleClose = () => {
      invoke("cmd_clean_preview_cache").catch(() => {});
    };

    window.addEventListener("beforeunload", handleClose);
    return () => {
      window.removeEventListener("beforeunload", handleClose);
      handleClose();
    };
  }, []);

  // Styled splash screen while verifying the session
  if (authStatus === "loading") {
    return (
      <main className="h-screen w-screen flex items-center justify-center bg-telegram-bg">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.svg" className="w-16 h-16 drop-shadow-lg animate-pulse" alt="Telegram Drive" />
          <p className="text-sm text-telegram-subtext tracking-wide">Restoring session...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="absolute inset-0 text-telegram-text overflow-hidden selection:bg-telegram-primary/30">
      <UpdateBanner
        available={available}
        version={version}
        downloading={downloading}
        progress={progress}
        onUpdate={downloadAndInstall}
        onDismiss={dismissUpdate}
      />
      <Toaster theme={theme} position="bottom-center" />
      {authStatus === "authenticated" && (
        <Suspense fallback={
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-telegram-bg">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-telegram-primary"></div>
          </div>
        }>
          {isMobile ? (
            <ErrorBoundary>
              <MobileDashboard onLogout={() => setAuthStatus("unauthenticated")} />
            </ErrorBoundary>
          ) : (
            <ErrorBoundary>
              <DesktopDashboard onLogout={() => setAuthStatus("unauthenticated")} />
            </ErrorBoundary>
          )}
        </Suspense>
      )}
      {authStatus === "unauthenticated" && (
        <AuthWizard
          onLogin={() => setAuthStatus("authenticated")}
          offlineMessage={restoreMessage}
        />
      )}
    </main>
  );
}


function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ConfirmProvider>
            <SettingsProvider>
              <AppContent />
            </SettingsProvider>
          </ConfirmProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
