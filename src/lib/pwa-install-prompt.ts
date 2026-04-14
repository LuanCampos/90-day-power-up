/**
 * Captures Chromium's `beforeinstallprompt` at app startup.
 * Must load from the entry module — lazy routes would register too late.
 */

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribePwaInstallPrompt(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function getPwaInstallPromptSnapshot(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function clearPwaInstallPrompt() {
  deferredPrompt = null;
  notify();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}
