// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({
    mode: "standalone", // Mode recommandé pour Docker
  }),
  server: {
    host: "0.0.0.0", // Écoute sur toutes les interfaces
    port: 8080, // Port exposé dans le Dockerfile
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
