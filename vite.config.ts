import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  base: mode === "production" ? "/rocket-buddy-app/" : "/",
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        // skipWaiting + clientsClaim for immediate activation
        skipWaiting: true,
        clientsClaim: true,
        // Cache bust on every build via revision hash
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        // Clean old caches
        cleanupOutdatedCaches: true,
        // Runtime caching for API calls
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
      },
      manifest: {
        name: "로켓버디",
        short_name: "로켓버디",
        description: "쿠팡 택배기사 업무 관리 앱",
        theme_color: "#1e40af",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "./",
        scope: "./",
        icons: [
          {
            src: "favicon.ico",
            sizes: "64x64",
            type: "image/x-icon",
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
