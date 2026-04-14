import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

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

// ── Global capture ──────────────────────────────────────────────────
// The `beforeinstallprompt` event may fire before any React component
// mounts. We store it at module level so it's never lost.

let _deferredPrompt: BeforeInstallPromptEvent | null = null;
const _listeners = new Set<() => void>();

function notifyListeners() {
  _listeners.forEach((fn) => fn());
}

function subscribeDeferredPrompt(onChange: () => void) {
  _listeners.add(onChange);
  return () => { _listeners.delete(onChange); };
}

function getDeferredPrompt() {
  return _deferredPrompt;
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    _deferredPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener("appinstalled", () => {
    _deferredPrompt = null;
    notifyListeners();
  });
}

// ── Hook ────────────────────────────────────────────────────────────

export function usePwaInstall() {
  const [isStandalone, setIsStandalone] = useState(() =>
    typeof window !== "undefined" ? isStandaloneMode() : false,
  );

  const deferredPrompt = useSyncExternalStore(subscribeDeferredPrompt, getDeferredPrompt);

  const isIos = useMemo(() => (typeof navigator !== "undefined" ? detectIos() : false), []);

  useEffect(() => {
    const onStandaloneMaybeChanged = () => setIsStandalone(isStandaloneMode());
    const mm = window.matchMedia("(display-mode: standalone)");
    mm.addEventListener("change", onStandaloneMaybeChanged);
    setIsStandalone(isStandaloneMode());
    return () => { mm.removeEventListener("change", onStandaloneMaybeChanged); };
  }, []);

  const promptInstall = useCallback(async (): Promise<"prompted" | "unavailable"> => {
    const prompt = getDeferredPrompt();
    if (!prompt) return "unavailable";
    try {
      await prompt.prompt();
      await prompt.userChoice;
      return "prompted";
    } finally {
      _deferredPrompt = null;
      notifyListeners();
    }
  }, []);

  return {
    isStandalone,
    canPrompt: deferredPrompt !== null,
    isIos,
    promptInstall,
  };
}
