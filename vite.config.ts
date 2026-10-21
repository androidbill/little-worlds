import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import release from "./release.json" with { type: "json" };

const base = process.env.BASE_PATH || "/";

export default defineConfig({
  base,
  build: { chunkSizeWarningLimit: 700 },
  plugins: [
    {
      name: "app-version",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "version.json",
          source: JSON.stringify({ version: release.version }),
        });
      },
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          const pathname = (request.url || "").split("?")[0];
          if (
            pathname !== `${base}version.json` &&
            pathname !== "/version.json"
          )
            return next();
          response.writeHead(200, {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          });
          response.end(JSON.stringify({ version: release.version }));
        });
      },
    },
    VitePWA({
      base,
      scope: base,
      registerType: "prompt",
      // Registration and refresh prompts are managed by src/updates.ts.
      injectRegister: false,
      includeAssets: ["app-192.png", "app-512.png", "apple-touch-icon.png"],
      manifest: {
        name: "Little Worlds — Happy Tile Gardens",
        short_name: "Little Worlds",
        description:
          "A vivid 2D cartoon tile matching escape. Twelve gardens, original art, and free play forever.",
        theme_color: "#eef8ff",
        background_color: "#eef8ff",
        display: "standalone",
        start_url: base,
        scope: base,
        icons: [
          {
            src: `${base}app-192.png`,
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: `${base}app-512.png`,
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      workbox: {
        skipWaiting: false,
        clientsClaim: false,
        globPatterns: [
          "**/*.{js,css,html,webp,woff2,mp3}",
          "app-*.png",
          "apple-touch-icon.png",
        ],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith("/version.json"),
            handler: "NetworkOnly",
          },
        ],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
});
