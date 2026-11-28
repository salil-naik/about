import { defineConfig, loadEnv } from "vite";
import { handleInterest } from "./server/waitlist.ts";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  return {
  plugins: [
    react(),
    {
      name: "learn-waitlist-api",
      configureServer(server) {
        server.middlewares.use("/api/interest", (req, res) => {
          void handleInterest(req, res, { url: env.WAITLIST_SITE_URL, serviceToken: env.WAITLIST_SITES_TOKEN, writeKey: env.WAITLIST_WRITE_KEY });
        });
      },
    },
    {
      name: "course-waitlist-api",
      configureServer(server) {
        server.middlewares.use("/api/course-interest", (req, res) => {
          void handleInterest(req, res, { url: env.COURSE_WAITLIST_SITE_URL, serviceToken: env.COURSE_WAITLIST_SITES_TOKEN, writeKey: env.COURSE_WAITLIST_WRITE_KEY });
        });
      },
    },
    {
      name: "starship-route",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url?.split(/[?#]/, 1)[0] === "/starship") {
            req.url = `/starship/${req.url.slice("/starship".length)}`;
          }
          next();
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        starship: resolve(import.meta.dirname, "starship/index.html"),
      },
    },
  },
  };
});
