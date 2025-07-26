import { defineStore } from "pinia";
import { ref, computed } from "vue";
// 导入角色 store，以便在聊天操作中获取当前激活的角色信息
import { useCharacterStore } from "./characterStore";

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

    /**
     * (核心修改) 开始一个与当前激活角色关联的新聊天
     */
    function startNewChat() {
      const characterStore = useCharacterStore();
      const activeCharacter = characterStore.activeCharacter;

      if (!activeCharacter) {
        alert("错误：没有激活的角色！请先在“角色”页面选择或创建一个角色。");
        return;
      }

      const newChatId = crypto.randomUUID();
      const newChat = {
        id: newChatId,
        characterId: activeCharacter.id, // 将聊天与角色 ID 绑定
        name: `${activeCharacter.name} - 新的聊天`,
        history: [
          // 第0层现在是角色的问候语或对话背景
          {
            id: "floor-0",
            role: "system",
            content: activeCharacter.first_mes || "在这里编辑对话背景...",
          },
        ],
        createdAt: new Date().toISOString(),
      };

      chats.value.unshift(newChat);
      activeChatId.value = newChatId;
      selectedMessages.value.clear();
      isSelectionModeActive.value = false;
    }

    /**
     * 向当前激活的聊天中添加一条消息
     */
    function addMessage(message) {
      if (!activeChat.value) {
        startNewChat();
        // 如果 startNewChat 因为没有激活角色而失败，则直接返回，防止错误
        if (!activeChat.value) return;
      }
      const messageWithId = { ...message, id: crypto.randomUUID() };

      // 如果这是会话的第一条用户消息，则用它来自动命名会话
      if (activeChat.value.history.length === 1 && message.role === "user") {
        const characterName =
          useCharacterStore().activeCharacter?.name || "未知角色";
        activeChat.value.name = `${characterName} - ${message.content.substring(
          0,
          20
        )}`;
      }
      activeChat.value.history.push(messageWithId);
    }

    /**
     * (核心修改) 确保应用加载或切换角色时，存在一个匹配的聊天会话
     */
    function ensureChatExists() {
      const characterStore = useCharacterStore();
      const activeCharId = characterStore.activeCharacterId;

      // 如果没有任何角色，则不执行任何操作
      if (!activeCharId) {
        // 如果角色列表为空，可以考虑创建一个默认角色，但目前保持简单
        if (characterStore.characterList.length > 0) {
          characterStore.activeCharacterId = characterStore.characterList[0].id;
        } else {
          return;
        }
      }

      // 查找当前激活角色的聊天记录
      const existingChatForChar = chats.value.find(
        (c) => c.characterId === characterStore.activeCharacterId
      );

      if (existingChatForChar) {
        // 如果找到了，就激活它
        activeChatId.value = existingChatForChar.id;
      } else if (characterStore.activeCharacterId) {
        // 如果有激活的角色但没有对应的聊天，则为TA创建一个新聊天
        startNewChat();
      } else if (chats.value.length > 0) {
        // Fallback: 激活列表中的第一个聊天
        activeChatId.value = chats.value[0].id;
      } else {
        // 如果没有任何聊天和角色，则尝试创建一个新聊天（会关联默认角色）
        startNewChat();
      }

      selectedMessages.value.clear();
      isSelectionModeActive.value = false;
    }

    /**
     * (核心修改) 切换聊天时，同时切换激活的角色
     */
    function switchChat(chatId) {
      const chat = chats.value.find((c) => c.id === chatId);
      if (chat) {
        // 切换到这个聊天所绑定的角色
        useCharacterStore().activeCharacterId = chat.characterId;
        // 激活这个聊天
        activeChatId.value = chatId;
        selectedMessages.value.clear();
        isSelectionModeActive.value = false;
      }
    }

    // --- 其他辅助函数 (保持不变) ---
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
