import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useChatStore = defineStore(
  "chat",
  () => {
    // --- State ---
    // 不再是单一的 history，而是一个包含多个 chat 对象的数组
    const chats = ref([]);
    // 当前激活的聊天会话的 ID
    const activeChatId = ref(null);

    // --- Getters (Computed) ---
    // 获取当前激活的聊天会话对象
    const activeChat = computed(() => {
      return chats.value.find((chat) => chat.id === activeChatId.value);
    });
    // 获取当前激活的聊天会话的历史记录
    const activeChatHistory = computed(() => {
      return activeChat.value ? activeChat.value.history : [];
    });

    // --- Actions ---

    // 开始一个新的聊天
    function startNewChat() {
      const newChatId = crypto.randomUUID(); // 使用浏览器内置的 API 生成唯一 ID
      chats.value.unshift({
        // unshift 将新聊天放在列表顶部
        id: newChatId,
        name: "新的聊天", // 默认名称
        history: [],
        createdAt: new Date().toISOString(),
      });
      activeChatId.value = newChatId; // 激活这个新聊天
    }

    // 切换到指定的聊天
    function switchChat(chatId) {
      activeChatId.value = chatId;
    }

    // 删除指定的聊天
    function deleteChat(chatId) {
      const index = chats.value.findIndex((chat) => chat.id === chatId);
      if (index === -1) return;

      chats.value.splice(index, 1);

      // 如果删除的是当前激活的聊天，则需要切换到另一个聊天
      if (activeChatId.value === chatId) {
        if (chats.value.length > 0) {
          // 切换到列表中的第一个聊天
          activeChatId.value = chats.value[0].id;
        } else {
          // 如果没有聊天了，则创建一个新的
          startNewChat();
        }
      }
    }

    // 向当前激活的聊天中添加一条消息
    function addMessage(message) {
      if (!activeChat.value) {
        // 如果没有任何激活的聊天（例如首次加载），则自动创建一个
        startNewChat();
      }

      // 如果这是会话的第一条用户消息，则用它来命名会话
      if (activeChat.value.history.length === 0 && message.role === "user") {
        activeChat.value.name = message.content.substring(0, 20); // 截取前20个字符作为标题
      }

      activeChat.value.history.push(message);
    }

    // (新增) 确保应用加载时至少有一个聊天
    function ensureChatExists() {
      if (chats.value.length === 0) {
        startNewChat();
      } else if (!activeChatId.value || !activeChat.value) {
        // 如果有聊天但没有激活的，则激活第一个
        activeChatId.value = chats.value[0].id;
      }
    }

    return {
      chats,
      activeChatId,
      activeChat,
      activeChatHistory,
      startNewChat,
      switchChat,
      deleteChat,
      addMessage,
      ensureChatExists,
    };
  },
  {
    persist: true,
  }
);
