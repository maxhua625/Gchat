import { defineStore } from "pinia";
import { ref } from "vue";

export const useSettingsStore = defineStore(
  "settings",
  () => {
    const openai = ref({
      apiKey: "",
      connected: false,
      models: [],
    });

    const gemini = ref({
      apiKey: "",
      connected: false,
      models: [],
    });

    // 1. (关键新增) 为 DeepSeek 添加状态对象
    const deepseek = ref({
      apiKey: "",
      connected: false,
      models: [],
    });

    // 默认激活模型可以保持不变
    const activeModel = ref({
      provider: "openai",
      modelName: "gpt-3.5-turbo",
    });

    return {
      openai,
      gemini,
      // 2. 导出 deepseek 状态
      deepseek,
      activeModel,
    };
  },
  {
    persist: true,
  }
);
