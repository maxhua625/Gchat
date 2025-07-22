import { createApp } from "vue";
import { createPinia } from "pinia"; // 导入 createPinia
import piniaPluginPersistedstate from "pinia-plugin-persistedstate"; // 导入持久化插件

import App from "./App.vue";
import router from "./router";
import "./assets/main.css";

const app = createApp(App);

const pinia = createPinia(); // 创建 Pinia 实例
pinia.use(piniaPluginPersistedstate); // 使用持久化插件

app.use(pinia); // 将 Pinia 实例应用到 app
app.use(router);

app.mount("#app");
