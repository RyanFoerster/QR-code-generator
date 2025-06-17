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
    port: process.env.NODE_ENV === "production" ? 8080 : 4321, // Port exposé dans le Dockerfile
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
