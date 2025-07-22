import { defineStore } from "pinia";
import { ref } from "vue";

export const useSettingsStore = defineStore(
  "settings",
  () => {
    // --- State ---
    const openai = ref({
      apiKey: "",
      // 新增：baseURL 字段，并设置官方默认值
      baseURL: "https://api.openai.com",
      connected: false,
      models: [],
    });

    const gemini = ref({
      apiKey: "",
      // 新增：baseURL 字段，并设置官方默认值
      baseURL: "https://generativelanguage.googleapis.com",
      connected: false,
      models: [],
    });

    const activeModel = ref({
      provider: "openai",
      modelName: "gpt-3.5-turbo",
    });

    return {
      openai,
      gemini,
      activeModel,
    };
  },
  {
    persist: true,
  }
);
