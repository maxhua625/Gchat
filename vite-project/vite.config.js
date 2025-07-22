import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path"; // 引入 path 模块

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // 设置 @ 别名指向 src 目录
    },
  },
  server: {
    proxy: {
      // 字符串简写写法
      // '/foo': 'http://localhost:4567',
      // 带选项写法
      "/v1": {
        target: "https://api.openai.com", // 目标服务器地址
        changeOrigin: true, // 需要虚拟主机站点
        // 如果你的请求路径中包含了 /api，但目标服务器不需要，可以用 rewrite
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
});
