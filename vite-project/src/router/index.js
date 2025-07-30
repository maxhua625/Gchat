import { createRouter, createWebHistory } from "vue-router";
import ChatView from "../views/ChatView.vue";
import SettingsView from "../views/SettingsView.vue";
import PresetsView from "../views/PresetsView.vue";
import AgentManagerView from "../views/AgentManagerView.vue";
// (关键新增) 导入新的 UserView
import UserView from "../views/UserView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "chat", component: ChatView },
    { path: "/settings", name: "settings", component: SettingsView },
    { path: "/presets", name: "presets", component: PresetsView },
    { path: "/agents", name: "agents", component: AgentManagerView },
    // (关键新增) 添加个人页面的路由
    { path: "/user", name: "user", component: UserView },
  ],
});

export default router;
