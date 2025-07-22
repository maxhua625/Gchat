import { defineStore } from "pinia";
import { ref } from "vue";

export const useSettingsStore = defineStore(
  "settings",
  () => {
    // --- State ---
    // API 设置
    const openai = ref({
      apiKey: "",
      // 你也可以把 baseURL 放在这里，方便用户自定义代理地址
      // baseURL: 'https://api.openai.com',
      connected: false, // 连接状态
      models: ["gpt-3.5-turbo", "gpt-4"], // 可以从API获取
    });

    const gemini = ref({
      apiKey: "",
      // baseURL: 'https://generativelanguage.googleapis.com',
      connected: false,
      models: ["gemini-pro"],
    });

    // 当前激活的模型配置
    const activeModel = ref({
      provider: "openai", // 'openai' or 'gemini'
      modelName: "gpt-3.5-turbo",
    });

    // --- Actions ---
    // 这里可以添加更多 action，比如保存设置等

    return {
      openai,
      gemini,
      activeModel,
    };
  },
  {
    persist: true, // 开启此 store 的持久化
  }
);
