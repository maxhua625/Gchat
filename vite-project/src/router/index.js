import { createRouter, createWebHistory } from "vue-router";
import ChatView from "../views/ChatView.vue";
import SettingsView from "../views/SettingsView.vue";
import PresetsView from "../views/PresetsView.vue";
import CharacterView from "../views/CharacterView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "chat", component: ChatView },
    { path: "/settings", name: "settings", component: SettingsView },
    { path: "/presets", name: "presets", component: PresetsView },
    // (关键修改) /characters 现在是角色和世界书的统一入口
    { path: "/characters", name: "characters", component: CharacterView },
    // Worldbook 路由已被移除
  ],
});

export default router;
