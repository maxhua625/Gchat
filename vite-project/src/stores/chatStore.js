import { defineStore } from "pinia";
import { ref } from "vue";

export const useChatStore = defineStore(
  "chat",
  () => {
    const history = ref([]);

    // 添加新消息的 action
    function addMessage(message) {
      history.value.push(message);
    }

    // 清空历史记录的 action
    function clearHistory() {
      history.value = [];
    }

    return {
      history,
      addMessage,
      clearHistory,
    };
  },
  {
    persist: true, // 开启此 store 的持久化
  }
);
