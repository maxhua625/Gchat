import { defineStore } from "pinia";
import { ref } from "vue";

export const useSettingsStore = defineStore(
  "settings",
  () => {
    const openai = ref({
      apiKey: "",
      // baseURL 已被移除
      connected: false,
      models: [],
    });

    const gemini = ref({
      apiKey: "",
      // baseURL 已被移除
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
