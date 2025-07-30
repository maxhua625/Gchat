import { defineStore } from "pinia";
import { ref } from "vue";

export const useUserStore = defineStore(
  "user",
  () => {
    // 定义用户的个人设定，包含名字和描述
    const persona = ref({
      name: "User",
      description: "", // 用户背景故事、人设等
    });

    return {
      persona,
    };
  },
  {
    persist: true, // 开启持久化，让您的设定不会因刷新而丢失
  }
);
