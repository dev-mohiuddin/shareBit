import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const appName = env.VITE_PWA_APP_NAME || "ShareBit Investor";
  const appDescription =
    env.VITE_PWA_APP_DESCRIPTION || "ShareBit investor and public portal";
  const themeColor = env.VITE_PWA_THEME_COLOR || "#ffffff";

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        manifestFilename: "manifest.webmanifest",
        includeAssets: [
          "vite.svg",
          "pwa-180x180.png",
          "pwa-192x192.png",
          "pwa-512x512.png",
          "pwa-maskable-512x512.png",
        ],
        manifest: {
          name: appName,
          short_name: "ShareBit",
          description: appDescription,
          theme_color: themeColor,
          background_color: "#ffffff",
          display: "standalone",
          scope: "/",
          start_url: "/",
          orientation: "portrait",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-maskable-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: ({ request, url }) =>
                request.method !== "GET" && /^https?:\/\/[^/]+\/api\/v1\//.test(url.href),
              handler: "NetworkOnly",
            },
            {
              urlPattern: ({ request, url }) =>
                request.method === "GET" &&
                /^https?:\/\/[^/]+\/api\/v1\/(wallet(?:\/|$)|users\/me(?:\/|$)|auth\/refresh-token(?:\/|$))/.test(
                  url.href
                ),
              handler: "NetworkOnly",
            },
            {
              urlPattern: ({ request, url }) =>
                request.method === "GET" &&
                /^https?:\/\/[^/]+\/api\/v1\/(assets(?:\/|$)|share-accounts\/me(?:\/|$))/.test(
                  url.href
                ),
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "investor-read-cache",
                cacheableResponse: {
                  statuses: [0, 200],
                },
                expiration: {
                  maxEntries: 40,
                  maxAgeSeconds: 24 * 60 * 60,
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
