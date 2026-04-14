import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

function manualChunks(id: string) {
  if (!id.includes("node_modules")) return;

  if (id.includes("framer-motion")) return "motion";
  if (id.includes("react-router")) return "router";
  if (id.includes("@tanstack/react-query") || id.includes("@tanstack/query-core")) return "query";
  if (id.includes("date-fns")) return "date-fns";
  if (id.includes("recharts")) return "recharts";
  if (id.includes("lucide-react")) return "icons";
  if (id.includes("@radix-ui")) return "radix";

  if (/node_modules\/(react-dom|scheduler)\//.test(id) || /node_modules\/react\//.test(id)) {
    return "react-vendor";
  }

  return "vendor";
}

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: "90 Day Power Up",
        short_name: "90 Day Power",
        description: "Acompanhamento do desafio de 90 dias — calorias, sono, cardio e treinos.",
        theme_color: "#12161c",
        background_color: "#12161c",
        display: "standalone",
        orientation: "portrait-primary",
        // Relative to manifest URL so GitHub Pages (base /<repo>/) resolves assets correctly;
        // leading "/" would point at github.io root and404.
        start_url: "./",
        scope: "./",
        icons: [
          {
            src: "pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "pwa-screenshot-wide.png",
            sizes: "1024x576",
            type: "image/png",
            form_factor: "wide",
            label: "Configurar início do desafio (desktop)",
          },
          {
            src: "pwa-screenshot-narrow.png",
            sizes: "540x720",
            type: "image/png",
            form_factor: "narrow",
            label: "Configurar início do desafio (mobile)",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
});
