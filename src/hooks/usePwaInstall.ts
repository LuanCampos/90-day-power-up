import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  clearPwaInstallPrompt,
  getPwaInstallPromptSnapshot,
  subscribePwaInstallPrompt,
} from "@/lib/pwa-install-prompt";

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

  const deferredPrompt = useSyncExternalStore(subscribePwaInstallPrompt, getPwaInstallPromptSnapshot);

  const isIos = useMemo(() => (typeof navigator !== "undefined" ? detectIos() : false), []);

  useEffect(() => {
    const onStandaloneMaybeChanged = () => setIsStandalone(isStandaloneMode());
    const mm = window.matchMedia("(display-mode: standalone)");
    mm.addEventListener("change", onStandaloneMaybeChanged);
    setIsStandalone(isStandaloneMode());
    return () => {
      mm.removeEventListener("change", onStandaloneMaybeChanged);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<"prompted" | "unavailable"> => {
    const prompt = getPwaInstallPromptSnapshot();
    if (!prompt) return "unavailable";
    try {
      await prompt.prompt();
      await prompt.userChoice;
      return "prompted";
    } finally {
      clearPwaInstallPrompt();
    }
  }, []);

  return {
    isStandalone,
    canPrompt: deferredPrompt !== null,
    isIos,
    promptInstall,
  };
}
