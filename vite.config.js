import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    port: 5174,
    strictPort: true, // Fail if port is already in use instead of trying another port
  },
});
