import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useChatStore = defineStore(
  "chat",
  () => {
    const chats = ref([]);
    const activeChatId = ref(null);
    const selectedMessages = ref(new Set());
    const editingMessageId = ref(null);
    const isSelectionModeActive = ref(false);

    const activeChat = computed(() =>
      chats.value.find((chat) => chat.id === activeChatId.value)
    );
    const activeChatHistory = computed(() =>
      activeChat.value ? activeChat.value.history : []
    );

    function startNewChat(agent) {
      if (!agent) {
        console.error("无法创建新聊天：没有提供智能体信息。");
        return;
      }
      const newChatId = crypto.randomUUID();
      const newChat = {
        id: newChatId,
        agentId: agent.id,
        name: `${agent.name} - 新的聊天`,
        history: [
          {
            id: "floor-0",
            role: "assistant",
            content: agent.first_mes || "你好！",
          },
        ],
        createdAt: new Date().toISOString(),
      };
      chats.value.unshift(newChat);
      activeChatId.value = newChatId;
      selectedMessages.value.clear();
      isSelectionModeActive.value = false;
    }

    function addMessage(message) {
      if (!activeChat.value) return;
      const messageWithId = { ...message, id: crypto.randomUUID() };
      if (activeChat.value.history.length === 1 && message.role === "user") {
        const chatNamePrefix = activeChat.value.name.split(" - ")[0];
        activeChat.value.name = `${chatNamePrefix} - ${message.content.substring(
          0,
          20
        )}`;
      }
      activeChat.value.history.push(messageWithId);
    }

    function ensureChatExists(agent) {
      if (!agent) return;
      const existingChatForAgent = chats.value.find(
        (c) => c.agentId === agent.id
      );
      if (existingChatForAgent) {
        activeChatId.value = existingChatForAgent.id;
      } else {
        startNewChat(agent);
      }
      selectedMessages.value.clear();
      isSelectionModeActive.value = false;
    }

    function updateMessageContent(messageId, newContent) {
      if (!activeChat.value) return;
      const message = activeChat.value.history.find((m) => m.id === messageId);
      if (message) message.content = newContent;
    }
    function toggleSelectionMode() {
      isSelectionModeActive.value = !isSelectionModeActive.value;
      if (!isSelectionModeActive.value) selectedMessages.value.clear();
    }
    function deleteChat(chatId) {
      const index = chats.value.findIndex((chat) => chat.id === chatId);
      if (index === -1) return;
      chats.value.splice(index, 1);
      if (activeChatId.value === chatId) {
        activeChatId.value = null;
      }
    }
    function toggleMessageSelection(messageId) {
      if (selectedMessages.value.has(messageId)) {
        selectedMessages.value.delete(messageId);
      } else {
        selectedMessages.value.add(messageId);
      }
    }
    function deleteSelectedMessages() {
      if (!activeChat.value || selectedMessages.value.size === 0) return;
      activeChat.value.history = activeChat.value.history.filter(
        (message) => !selectedMessages.value.has(message.id)
      );
      selectedMessages.value.clear();
      isSelectionModeActive.value = false;
    }
    function removeLastAssistantMessage() {
      if (!activeChat.value) return false;
      const history = activeChat.value.history;
      if (
        history.length > 0 &&
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
      editingMessageId,
      isSelectionModeActive,
      activeChat,
      activeChatHistory,
      startNewChat,
      addMessage,
      updateMessageContent,
      toggleSelectionMode,
      deleteChat,
      toggleMessageSelection,
      deleteSelectedMessages,
      removeLastAssistantMessage,
      ensureChatExists,
    };
  },
  {
    persist: {
      serializer: {
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
