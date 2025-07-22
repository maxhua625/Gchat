import { createRouter, createWebHistory } from "vue-router";
import ChatView from "../views/ChatView.vue";
// 1. 导入新的 SettingsView 组件
import SettingsView from "../views/SettingsView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "chat",
      component: ChatView,
    },
    // 2. 为设置页面添加新的路由规则
    {
      path: "/settings",
      name: "settings",
      component: SettingsView,
    },
  ],
});

export default router;
