/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** Chromium install prompt (not in all TS lib targets). */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}
