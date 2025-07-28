import { defineStore } from "pinia";
import { ref, computed } from "vue";
// (关键修复) 导入我们新的、统一的 agentStore
import { useAgentStore } from "./agentStore";

export const useChatStore = defineStore(
  "chat",
  () => {
    // --- State ---
    const chats = ref([]);
    const activeChatId = ref(null);
    const selectedMessages = ref(new Set());
    const editingMessageId = ref(null);
    const isSelectionModeActive = ref(false);

    // --- Getters ---
    const activeChat = computed(() =>
      chats.value.find((chat) => chat.id === activeChatId.value)
    );
    const activeChatHistory = computed(() =>
      activeChat.value ? activeChat.value.history : []
    );

    // --- Actions ---

    // (关键修复) 开始一个与特定智能体关联的新聊天
    function startNewChat() {
      // 从 agentStore 中获取激活的智能体
      const agentStore = useAgentStore();
      const activeAgent = agentStore.activeAgent;

      if (!activeAgent) {
        alert("错误：没有激活的智能体！请先在“智能体管理”页面选择或创建一个。");
        return;
      }

      const newChatId = crypto.randomUUID();
      const newChat = {
        id: newChatId,
        // 将聊天与智能体 ID 绑定
        characterId: activeAgent.id,
        name: `${activeAgent.name} - 新的聊天`,
        history: [
          {
            id: "floor-0",
            role: "assistant",
            content: activeAgent.first_mes || "你好！",
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
      if (!activeChat.value) {
        startNewChat();
        if (!activeChat.value) return;
      }
      const messageWithId = { ...message, id: crypto.randomUUID() };
      if (activeChat.value.history.length === 1 && message.role === "user") {
        const agentName = useAgentStore().activeAgent?.name || "未知角色";
        activeChat.value.name = `${agentName} - ${message.content.substring(
          0,
          20
        )}`;
      }
      activeChat.value.history.push(messageWithId);
    }

    function updateMessageContent(messageId, newContent) {
      if (!activeChat.value) return;
      const message = activeChat.value.history.find((m) => m.id === messageId);
      if (message) message.content = newContent;
    }

    function ensureChatExists() {
      const agentStore = useAgentStore();
      const activeAgentId = agentStore.activeAgentId;

      if (!activeAgentId && agentStore.agentList.length > 0) {
        agentStore.activeAgentId = agentStore.agentList[0].id;
      }

      const existingChatForAgent = chats.value.find(
        (c) => c.characterId === agentStore.activeAgentId
      );

      if (existingChatForAgent) {
        activeChatId.value = existingChatForAgent.id;
      } else if (agentStore.activeAgentId) {
        startNewChat();
      } else if (chats.value.length > 0) {
        activeChatId.value = chats.value[0].id;
      } else {
        startNewChat();
      }

      selectedMessages.value.clear();
      isSelectionModeActive.value = false;
    }

    // (关键修复) 切换聊天时，同时更新 agentStore 中的激活 ID
    function switchChat(chatId) {
      const chat = chats.value.find((c) => c.id === chatId);
      if (chat) {
        useAgentStore().activeAgentId = chat.characterId;
        activeChatId.value = chatId;
        selectedMessages.value.clear();
        isSelectionModeActive.value = false;
      }
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
        ensureChatExists();
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
      switchChat,
      deleteChat,
      addMessage,
      updateMessageContent,
      toggleSelectionMode,
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
          const serializedState = JSON.parse(JSON.stringify(state));
          serializedState.selectedMessages = Array.from(state.selectedMessages);
          return JSON.stringify(serializedState);
        },
        deserialize: (str) => {
          const deserializedState = JSON.parse(str);
          deserializedState.selectedMessages = new Set(
            deserializedState.selectedMessages
          );
          return deserializedState;
        },
      },
    },
  }
);
