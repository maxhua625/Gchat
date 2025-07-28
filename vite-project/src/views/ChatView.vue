<template>
  <div class="chat-wrapper">
    <div class="chat-info-header">
      <!-- (关键修复) 从 agentStore 中获取激活的智能体名称 -->
      当前智能体: <strong>{{ agentStore.activeAgent?.name || "无" }}</strong> |
      当前预设: <strong>{{ presets.activePreset.name }}</strong>
    </div>

    <div class="message-list" ref="messageListRef">
      <Message
        v-for="(item, index) in chat.activeChatHistory"
        :key="item.id"
        :item="item"
        :floor="index"
        @regenerate="handleRegenerate"
      />
      <div v-if="isLoading" class="loading-indicator">
        <Message
          :item="{ role: 'assistant', content: '...' }"
          :floor="chat.activeChatHistory.length"
        />
      </div>
    </div>

    <div class="chat-input-area">
      <div class="chat-actions">
        <button
          class="menu-button"
          @click="isMenuOpen = !isMenuOpen"
          title="聊天选项"
        >
          <span>☰</span>
        </button>
        <div v-if="isMenuOpen" class="dropdown-menu">
          <ul>
            <li @click="handleNewChat">➕ 开始新聊天</li>
            <li @click="handleRegenerate">🔄 重新生成</li>
            <li @click="handleToggleSelectionMode">
              {{
                chat.isSelectionModeActive ? "✅ 完成选择" : "🗑️ 选择消息以删除"
              }}
            </li>
            <li
              v-if="
                chat.isSelectionModeActive && chat.selectedMessages.size > 0
              "
              @click="handleDeleteSelected"
              class="delete-option"
            >
              删除选中的 {{ chat.selectedMessages.size }} 条消息
            </li>
            <li class="separator"></li>
            <li class="menu-header">
              选择与 {{ agentStore.activeAgent?.name }} 的聊天
            </li>
            <div class="chat-history-list">
              <li
                v-for="chatSession in agentChats"
                :key="chatSession.id"
                @click="handleSwitchChat(chatSession.id)"
                :class="{ active: chatSession.id === chat.activeChatId }"
              >
                {{ chatSession.name }}
              </li>
            </div>
            <li class="separator"></li>
            <li @click="handleAttachFile">📎 附加文件 (开发中)</li>
          </ul>
        </div>
      </div>

      <form @submit.prevent="sendMessage" class="input-form">
        <input
          type="text"
          v-model="userInput"
          placeholder="在这里输入您的消息..."
          :disabled="isLoading"
        />
        <button type="submit" :disabled="isLoading || !userInput">
          <span v-if="!isLoading">发送</span>
          <span v-else>思考中...</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from "vue";
import Message from "@/components/Message.vue";
import api from "@/api";
import { useChatStore } from "@/stores/chatStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { usePresetsStore } from "@/stores/presetsStore";
// (关键修复) 移除对旧 store 的引用，只导入新的 agentStore
import { useAgentStore } from "@/stores/agentStore";

// --- Store 初始化 ---
const chat = useChatStore();
const settings = useSettingsStore();
const presets = usePresetsStore();
// (关键修复) 使用 agentStore
const agentStore = useAgentStore();

// --- 响应式状态 ---
const userInput = ref("");
const isLoading = ref(false);
const messageListRef = ref(null);
const isMenuOpen = ref(false);

// --- 计算属性 ---
// (关键修复) 从 agentStore 中获取 activeAgentId
const agentChats = computed(() => {
  if (!agentStore.activeAgentId) return [];
  return chat.chats.filter((c) => c.characterId === agentStore.activeAgentId);
});

// --- (核心) 构建最终上下文的函数 ---
const buildFinalMessages = () => {
  const finalMessages = [];
  const activePreset = presets.activePreset;
  // (关键修复) 从 agentStore 中获取激活的智能体
  const activeAgent = agentStore.activeAgent;
  const currentHistory = chat.activeChatHistory;

  if (!activeAgent) {
    console.error("没有激活的智能体！");
    return currentHistory;
  }

  // (关键修复) 从 agentStore 中获取世界书
  const globalWorldbook = agentStore.globalWorldbookEntries;
  const localWorldbook = agentStore.getLocalWorldbookEntries(
    activeAgent.id
  ).value;

  const replacePlaceholders = (text) => {
    if (typeof text !== "string") return "";
    return text
      .replace(/{{char}}/g, activeAgent.name)
      .replace(/{{user}}/g, "User");
  };

  // --- 上下文注入顺序 ---
  // (此部分逻辑已更新，以使用 agentStore)
  // 1. 注入世界书
  globalWorldbook.forEach((entry) => {
    if (entry.enabled && entry.content) {
      finalMessages.push({
        role: "system",
        content: `[World Info: ${entry.content}]`,
      });
    }
  });
  localWorldbook.forEach((entry) => {
    if (entry.enabled && entry.content) {
      finalMessages.push({
        role: "system",
        content: `[Character World Info: ${entry.content}]`,
      });
    }
  });

  // 2. 注入预设中的提示词
  if (activePreset && activePreset.prompts) {
    activePreset.prompts.forEach((prompt) => {
      if (prompt.enabled && prompt.content) {
        finalMessages.push({
          role: prompt.role || "system",
          content: replacePlaceholders(prompt.content),
        });
      }
    });
  }

  // 3. 注入当前聊天历史
  finalMessages.push(...currentHistory);
  return finalMessages;
};

// --- 核心请求逻辑 ---
const executeApiCall = async () => {
  isLoading.value = true;

  const provider = settings.activeModel.provider;
  const config = settings.providerConfig[provider];
  const activeModelName = settings.activeModel.modelName;

  const finalMessages = buildFinalMessages();

  try {
    let response;
    const activePreset = presets.activePreset;
    const modelParams = {
      model: activeModelName,
      temperature: activePreset?.temperature,
      top_p: activePreset?.top_p,
      top_k: activePreset?.top_k,
    };

    if (provider === "gemini") {
      const contentsForAPI = {
        contents: finalMessages.map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })),
      };
      response = await api.gemini.fetchGeminiCompletion(
        activeModelName,
        contentsForAPI,
        config.apiKey
      );
      chat.addMessage({
        role: "assistant",
        content: response.candidates[0].content.parts[0].text.trim(),
      });
    } else {
      const params = { ...modelParams, messages: finalMessages };
      let fetchFunc;
      if (provider === "custom") {
        fetchFunc = api.custom.fetchCustomChatCompletion;
        response = await fetchFunc(params, config.apiKey, config.baseURL);
      } else {
        fetchFunc =
          api.openai.fetchOpenAIChatCompletion ||
          api.deepseek.fetchDeepseekChatCompletion;
        response = await fetchFunc(params, config.apiKey);
      }
      chat.addMessage(response.choices[0].message);
    }
  } catch (error) {
    const errorMessage = `获取回复失败: ${
      error.response?.data?.error?.message || error.message
    }`;
    chat.addMessage({ role: "assistant", content: errorMessage });
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

const sendMessage = async () => {
  if (!userInput.value || isLoading.value) return;
  if (!agentStore.activeAgentId) {
    alert("请先到“智能体管理”页面选择一个聊天对象！");
    return;
  }

  chat.addMessage({ role: "user", content: userInput.value });
  userInput.value = "";

  await executeApiCall();
};

// --- 菜单和生命周期函数 ---
const handleRegenerate = () => {
  isMenuOpen.value = false;
  if (isLoading.value) return;
  chat.removeLastAssistantMessage();
  executeApiCall();
};
const handleToggleSelectionMode = () => {
  chat.toggleSelectionMode();
  if (!chat.isSelectionModeActive) {
    isMenuOpen.value = false;
  }
};
const handleDeleteSelected = () => {
  if (chat.selectedMessages.size > 0) {
    if (
      confirm(`你确定要删除选中的 ${chat.selectedMessages.size} 条消息吗？`)
    ) {
      chat.deleteSelectedMessages();
    }
  }
  isMenuOpen.value = false;
};
const handleNewChat = () => {
  chat.startNewChat();
  isMenuOpen.value = false;
};
const handleSwitchChat = (chatId) => {
  chat.switchChat(chatId);
  isMenuOpen.value = false;
};
const handleAttachFile = () => {
  alert("附加文件功能正在开发中！");
  isMenuOpen.value = false;
};
const scrollToBottom = async () => {
  await nextTick();
  const listEl = messageListRef.value;
  if (listEl) listEl.scrollTop = listEl.scrollHeight;
};

watch(
  () => chat.activeChatHistory.length,
  () => {
    scrollToBottom();
  }
);

// (关键修复) 监听 agentStore 中 activeAgentId 的变化
watch(
  () => agentStore.activeAgentId,
  (newId, oldId) => {
    if (newId !== oldId) {
      chat.ensureChatExists();
      isMenuOpen.value = false;
    }
  }
);

onMounted(() => {
  chat.ensureChatExists();
  scrollToBottom();
});
</script>

<style scoped>
/* 样式保持不变 */
.chat-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.chat-info-header {
  padding: 0.75rem 1rem;
  background-color: #f7f7f7;
  border-bottom: 1px solid #e0e0e0;
  text-align: center;
  color: #333;
  flex-shrink: 0;
}
.message-list {
  flex-grow: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: #f0f2f5;
}
.chat-input-area {
  padding: 1rem;
  background-color: #fff;
  border-top: 1px solid #d9d9d9;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.chat-actions {
  position: relative;
  margin-right: 0.5rem;
}
.menu-button {
  background-color: #f0f2f5;
  border: 1px solid #ccc;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.5rem;
}
.menu-button:hover {
  background-color: #e9ecef;
}
.dropdown-menu {
  position: absolute;
  bottom: 50px;
  left: 0;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 240px;
  z-index: 10;
  overflow: hidden;
}
.dropdown-menu ul {
  list-style: none;
  padding: 0.5rem 0;
  margin: 0;
}
.dropdown-menu li {
  padding: 0.75rem 1rem;
  cursor: pointer;
}
.dropdown-menu li:hover {
  background-color: #f0f2f5;
}
.dropdown-menu li.delete-option {
  color: #dc3545;
  font-weight: 700;
}
.dropdown-menu li.delete-option:hover {
  background-color: #f8d7da;
}
.dropdown-menu li.separator {
  height: 1px;
  background-color: #e9ecef;
  margin: 0.5rem 0;
  padding: 0;
}
.dropdown-menu li.menu-header {
  font-weight: 700;
  color: #6c757d;
  padding: 0.5rem 1rem;
  font-size: 0.9em;
  cursor: default;
}
.dropdown-menu li.menu-header:hover {
  background: 0 0;
}
.chat-history-list {
  max-height: 150px;
  overflow-y: auto;
}
.chat-history-list li.active {
  background-color: #007bff;
  color: #fff;
}
.input-form {
  display: flex;
  gap: 0.5rem;
  width: 100%;
}
.input-form input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
}
.input-form input:focus {
  outline: 0;
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}
.input-form button {
  padding: 0.75rem 1.5rem;
  border: none;
  background-color: #4caf50;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}
.input-form button:disabled {
  background-color: #ccc;
}
</style>
