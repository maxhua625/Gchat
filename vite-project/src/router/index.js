import { createRouter, createWebHistory } from "vue-router";
import ChatView from "../views/ChatView.vue";
import SettingsView from "../views/SettingsView.vue";
// 1. 导入新的页面组件
import WorldbookView from "../views/WorldbookView.vue";
import PresetsView from "../views/PresetsView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "chat",
      component: ChatView,
    },
    {
      path: "/settings",
      name: "settings",
      component: SettingsView,
    },
    // 2. 添加新的路由规则
    {
      path: "/worldbook",
      name: "worldbook",
      component: WorldbookView,
    },
    {
      path: "/presets",
      name: "presets",
      component: PresetsView,
    },
  ],
});

export default router;
