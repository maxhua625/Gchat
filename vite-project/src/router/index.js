import { createRouter, createWebHistory } from "vue-router";
import ChatView from "../views/ChatView.vue";
import SettingsView from "../views/SettingsView.vue";
import PresetsView from "../views/PresetsView.vue";
// 1. 导入新的统一视图
import AgentManagerView from "../views/AgentManagerView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "chat", component: ChatView },
    { path: "/settings", name: "settings", component: SettingsView },
    { path: "/presets", name: "presets", component: PresetsView },
    // 2. 添加新的统一路由
    { path: "/agents", name: "agents", component: AgentManagerView },
  ],
});

export default router;
