import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { VitePWA } from "vite-plugin-pwa";

/** Em desenvolvimento, atende /api/* com o mesmo handler usado na Vercel. */
function devApi(): Plugin {
  return {
    name: "ponte-zero-dev-api",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api", async (req, res) => {
        const { handleApi } = (await server.ssrLoadModule("/api/index.ts")) as typeof import("./api/index");
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const request = new Request(new URL(req.originalUrl ?? req.url ?? "/", "http://localhost"), {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: ["GET", "HEAD"].includes(req.method ?? "GET") ? undefined : Buffer.concat(chunks),
        });
        const response = await handleApi(request);
        res.statusCode = response.status;
        response.headers.forEach((v, k) => res.setHeader(k, v));
        res.end(Buffer.from(await response.arrayBuffer()));
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return {
    plugins: [
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      react(),
      tailwindcss(),
      tsconfigPaths(),
      devApi(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "apple-touch-icon-180x180.png", "logo.svg"],
        manifest: {
          name: "Ponte Zero",
          short_name: "Ponte Zero",
          description: "Conectando estudantes a oportunidades, antes que seja tarde.",
          lang: "pt-BR",
          start_url: "/",
          scope: "/",
          display: "standalone",
          orientation: "portrait",
          background_color: "#FFF9EB",
          theme_color: "#235369",
          icons: [
            { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
            { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
            { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,webp,woff2}"],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
              handler: "NetworkFirst",
              method: "GET",
              options: { cacheName: "api", networkTimeoutSeconds: 5, expiration: { maxEntries: 100, maxAgeSeconds: 86400 } },
            },
            {
              urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com",
              handler: "CacheFirst",
              options: { cacheName: "fonts", expiration: { maxEntries: 20, maxAgeSeconds: 31536000 } },
            },
          ],
        },
      }),
    ],
  };
});
