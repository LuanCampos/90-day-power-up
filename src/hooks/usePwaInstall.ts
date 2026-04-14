import { useCallback, useEffect, useMemo, useState } from "react";

function isStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function detectIos(): boolean {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

export function usePwaInstall() {
  const [isStandalone, setIsStandalone] = useState(() =>
    typeof window !== "undefined" ? isStandaloneMode() : false,
  );
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const isIos = useMemo(() => (typeof navigator !== "undefined" ? detectIos() : false), []);

  useEffect(() => {
    const onStandaloneMaybeChanged = () => setIsStandalone(isStandaloneMode());
    const mm = window.matchMedia("(display-mode: standalone)");
    mm.addEventListener("change", onStandaloneMaybeChanged);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(isStandaloneMode());
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    setIsStandalone(isStandaloneMode());

    return () => {
      mm.removeEventListener("change", onStandaloneMaybeChanged);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<"prompted" | "unavailable"> => {
    if (!deferredPrompt) return "unavailable";
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      return "prompted";
    } finally {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  return {
    isStandalone,
    canPrompt: deferredPrompt !== null,
    isIos,
    promptInstall,
  };
}
