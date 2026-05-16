import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5188,
    strictPort: true,
    allowedHosts: ["book.dev.raftforge.art", "localhost", "127.0.0.1"],
    proxy: {
      "/api": {
        target: "http://booking_dev_app:8000",
        changeOrigin: true,
      },
    },
  },
});
