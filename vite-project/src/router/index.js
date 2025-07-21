import { createRouter, createWebHistory } from "vue-router";
import ChatView from "../views/ChatView.vue";
import SettingsView from "../views/SettingsView.vue";

// 1. 定义路由
// 每个路由都需要映射到一个组件。
const routes = [
  {
    path: "/",
    // 重定向到聊天页面，作为默认页
    redirect: "/chat",
  },
  {
    path: "/chat",
    name: "Chat",
    component: ChatView,
  },
  {
    path: "/settings",
    name: "Settings",
    component: SettingsView,
  },
];

// 2. 创建路由实例
const router = createRouter({
  // 使用 HTML5 History 模式，URL 中不会有 #
  history: createWebHistory(),
  routes, // `routes: routes` 的缩写
});

// 3. 导出路由实例，以便在 main.js 中使用
export default router;
