import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const base = process.env.BASE_PATH || "/";

export default defineConfig({
  base,
  build: { chunkSizeWarningLimit: 700 },
  plugins: [
    VitePWA({
      base,
      scope: base,
      registerType: "autoUpdate",
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
        globPatterns: [
          "**/*.{js,css,html,webp,woff2}",
          "app-*.png",
          "apple-touch-icon.png",
        ],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
      },
    }),
  ],
});
