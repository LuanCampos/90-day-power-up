import "@/lib/pwa-install-prompt";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

/** Reconsulta o service worker: abas longas raramente disparam update check sozinhas. */
const PWA_UPDATE_CHECK_MS = 60 * 60 * 1000;

registerSW({
  immediate: true,
  onRegisteredSW(_swScriptUrl, registration) {
    if (!registration) return;

    const checkForUpdate = () => {
      void registration.update();
    };

    window.setInterval(checkForUpdate, PWA_UPDATE_CHECK_MS);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        checkForUpdate();
      }
    });

    window.addEventListener("online", checkForUpdate);
  },
});

createRoot(document.getElementById("root")!).render(<App />);
