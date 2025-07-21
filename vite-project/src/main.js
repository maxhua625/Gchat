import { createApp } from "vue";
import App from "./App.vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

// 1. 导入我们创建的路由实例
import router from "./router";

const app = createApp(App);

// 2. 告诉 Vue 应用使用路由
app.use(router);

app.use(ElementPlus);
app.mount("#app");
