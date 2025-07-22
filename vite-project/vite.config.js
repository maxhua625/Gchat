import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    proxy: {
      // 这是 OpenAI 的代理规则 (保留)
      "/v1": {
        target: "https://api.openai.com",
        changeOrigin: true,
      },
      // 新增：这是 Gemini 的代理规则
      "/v1beta": {
        target: "https://generativelanguage.googleapis.com",
        changeOrigin: true,
      },
    },
  },
});
