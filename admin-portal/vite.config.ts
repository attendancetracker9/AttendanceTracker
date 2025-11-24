import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api/fast2sms": {
        target: "https://www.fast2sms.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fast2sms/, "/dev/bulkV2"),
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            // Forward the authorization header from the request
            const authHeader = req.headers["x-api-key"];
            if (authHeader) {
              proxyReq.setHeader("authorization", authHeader);
            }
          });
        }
      }
    }
  }
});

