import { defineStore } from "pinia";
import { ref } from "vue";

export const useSettingsStore = defineStore(
  "settings",
  () => {
    // 统一存储所有提供商的配置
    const providerConfig = ref({
      openai: { apiKey: "", connected: false, models: [] },
      gemini: { apiKey: "", connected: false, models: [] },
      deepseek: { apiKey: "", connected: false, models: [] },
      custom: { baseURL: "", apiKey: "", connected: false, models: [] },
    });

    // 默认激活的模型
    const activeModel = ref({
      provider: "openai", // openai, gemini, deepseek, custom
      modelName: "gpt-3.5-turbo",
    });

    return {
      providerConfig,
      activeModel,
    };
  },
  {
    persist: true,
  }
);
