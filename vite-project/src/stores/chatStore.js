import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useChatStore = defineStore(
  "chat",
  () => {
    // --- State ---
    const chats = ref([]);
    const activeChatId = ref(null);
    const selectedMessages = ref(new Set());

    // (关键新增) 用于存放当前正在编辑的消息的 ID
    const editingMessageId = ref(null);
    // (关键新增) 用于控制是否显示复选框的“选择模式”开关
    const isSelectionModeActive = ref(false);

    // --- Getters ---
    const activeChat = computed(() =>
      chats.value.find((chat) => chat.id === activeChatId.value)
    );
    const activeChatHistory = computed(() =>
      activeChat.value ? activeChat.value.history : []
    );

    // --- Actions ---

    function startNewChat() {
      // ... (此函数保持不变)
      const newChatId = crypto.randomUUID();
      chats.value.unshift({
        id: newChatId,
        name: "新的聊天",
        history: [
          { id: "floor-0", role: "system", content: "在这里编辑对话背景..." },
        ],
        createdAt: new Date().toISOString(),
      });
      activeChatId.value = newChatId;
      selectedMessages.value.clear();
      isSelectionModeActive.value = false;
    }

    function addMessage(message) {
      if (!activeChat.value) startNewChat();
      const messageWithId = { ...message, id: crypto.randomUUID() };
      if (activeChat.value.history.length === 1 && message.role === "user") {
        // length === 1 因为有第0层
        activeChat.value.name = message.content.substring(0, 20);
      }
      activeChat.value.history.push(messageWithId);
    }

    // (关键新增) 更新指定消息的内容
    function updateMessageContent(messageId, newContent) {
      if (!activeChat.value) return;
      const message = activeChat.value.history.find((m) => m.id === messageId);
      if (message) {
        message.content = newContent;
      }
    }

    // (关键新增) 切换“选择模式”
    function toggleSelectionMode() {
      isSelectionModeActive.value = !isSelectionModeActive.value;
      // 退出选择模式时，清空所有已选项
      if (!isSelectionModeActive.value) {
        selectedMessages.value.clear();
      }
    }

    function deleteSelectedMessages() {
      if (!activeChat.value || selectedMessages.value.size === 0) return;
      activeChat.value.history = activeChat.value.history.filter(
        (message) => !selectedMessages.value.has(message.id)
      );
      selectedMessages.value.clear();
      isSelectionModeActive.value = false; // 删除后自动退出选择模式
    }

    function ensureChatExists() {
      if (chats.value.length === 0) {
        startNewChat();
      } else if (!activeChatId.value || !activeChat.value) {
        activeChatId.value = chats.value[0].id;
      }
      // 确保每个聊天都有第0层
      chats.value.forEach((chat) => {
        if (!chat.history.find((m) => m.id === "floor-0")) {
          chat.history.unshift({
            id: "floor-0",
            role: "system",
            content: "在这里编辑对话背景...",
          });
        }
      });
      selectedMessages.value.clear();
      isSelectionModeActive.value = false;
    }

    // ... (其他函数: switchChat, deleteChat, toggleMessageSelection, removeLastAssistantMessage 保持不变)
    function switchChat(chatId) {
      activeChatId.value = chatId;
      selectedMessages.value.clear();
      isSelectionModeActive.value = false;
    }
    function deleteChat(chatId) {
      const index = chats.value.findIndex((chat) => chat.id === chatId);
      if (index === -1) return;
      chats.value.splice(index, 1);
      if (activeChatId.value === chatId) {
        if (chats.value.length > 0) {
          activeChatId.value = chats.value[0].id;
        } else {
          startNewChat();
        }
      }
    }
    function toggleMessageSelection(messageId) {
      if (selectedMessages.value.has(messageId)) {
        selectedMessages.value.delete(messageId);
      } else {
        selectedMessages.value.add(messageId);
      }
    }
    function removeLastAssistantMessage() {
      if (!activeChat.value) return false;
      const history = activeChat.value.history;
      if (
        history.length > 1 &&
        history[history.length - 1].role === "assistant"
      ) {
        history.pop();
        return true;
      }
      return false;
    }

    return {
      chats,
      activeChatId,
      selectedMessages,
      editingMessageId, // 导出
      isSelectionModeActive, // 导出
      activeChat,
      activeChatHistory,
      startNewChat,
      switchChat,
      deleteChat,
      addMessage,
      updateMessageContent, // 导出
      toggleSelectionMode, // 导出
      toggleMessageSelection,
      deleteSelectedMessages,
      removeLastAssistantMessage,
      ensureChatExists,
    };
  },
  {
    persist: {
      /* ... (持久化配置保持不变) */ serializer: {
        serialize: (state) => {
          const s = {
            ...state,
            selectedMessages: Array.from(state.selectedMessages),
          };
          return JSON.stringify(s);
        },
        deserialize: (str) => {
          const s = JSON.parse(str);
          s.selectedMessages = new Set(s.selectedMessages);
          return s;
        },
      },
    },
  }
);
