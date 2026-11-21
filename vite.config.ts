import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [
    react(),
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
});
