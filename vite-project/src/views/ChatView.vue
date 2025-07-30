<template>
  <div v-if="chat.activeChat" class="chat-wrapper">
    <div class="chat-info-header">
      当前角色: <strong>{{ agentStore.activeAgent?.name || "无" }}</strong> |
      当前预设: <strong>{{ presets.activePreset?.name || "无" }}</strong>
    </div>

    <div class="message-list" ref="messageListRef">
      <Message
        v-for="(item, index) in chat.activeChatHistory"
        :key="item.id"
        :item="item"
        :floor="index"
        @regenerate="() => handleRegenerate(item)"
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
            <li @click="() => handleRegenerate()">🔄 重新生成</li>
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

  <div v-else class="chat-placeholder">
    <div v-if="agentStore.activeAgent">
      <p>
        正在为
        <strong>{{ agentStore.activeAgent.name }}</strong> 加载聊天记录...
      </p>
      <div class="spinner"></div>
    </div>
    <div v-else>
      <p>请先到“智能体管理”页面选择一个聊天对象。</p>
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
import { useAgentStore } from "@/stores/agentStore";
// (关键新增) 导入新的 userStore
import { useUserStore } from "@/stores/userStore";

const chat = useChatStore();
const settings = useSettingsStore();
const presets = usePresetsStore();
const agentStore = useAgentStore();
// (关键新增) 创建 userStore 实例
const userStore = useUserStore();

const userInput = ref("");
const isLoading = ref(false);
const messageListRef = ref(null);
const isMenuOpen = ref(false);

const agentChats = computed(() => {
  if (!agentStore.activeAgentId) return [];
  return chat.chats.filter((c) => c.agentId === agentStore.activeAgentId);
});

// (关键修改) 这是最终的、支持“个人设定”的上下文构建函数
const buildFinalMessages = (regenerateFromMessage = null) => {
  const finalMessages = [];
  const activePreset = presets.activePreset;
  const activeAgent = agentStore.activeAgent;
  // 获取个人设定
  const userPersona = userStore.persona;

  if (!activeAgent || !activePreset?.prompt_order) {
    return regenerateFromMessage
      ? chat.activeChatHistory.slice(
          0,
          chat.activeChatHistory.findIndex(
            (m) => m.id === regenerateFromMessage.id
          )
        )
      : chat.activeChatHistory;
  }

  // (关键修改) 占位符现在会动态替换为您的名字
  const replacePlaceholders = (text) => {
    if (typeof text !== "string") return "";
    return text
      .replace(/{{char}}/g, activeAgent.name)
      .replace(/{{user}}/g, userPersona.name || "User");
  };

  const historyToInject = regenerateFromMessage
    ? chat.activeChatHistory.slice(
        0,
        chat.activeChatHistory.findIndex(
          (m) => m.id === regenerateFromMessage.id
        )
      )
    : chat.activeChatHistory;

  activePreset.prompt_order.forEach((orderItem) => {
    if (!orderItem.enabled) return;
    const promptModule = activePreset.prompts.find(
      (p) => p.identifier === orderItem.identifier
    );
    if (!promptModule) return;

    if (promptModule.marker) {
      if (promptModule.identifier === "chatHistory") {
        finalMessages.push(...historyToInject);
      } else if (promptModule.identifier === "personaDescription") {
        // (核心逻辑) 在这里注入您的个人设定！
        if (userPersona.description) {
          finalMessages.push({
            role: "system",
            content: `[User's Persona: ${userPersona.description}]`,
          });
        }
      } else if (
        promptModule.identifier === "worldInfoBefore" ||
        promptModule.identifier === "worldInfoAfter"
      ) {
        const worldEntries = [
          ...agentStore.globalLorebookEntries,
          ...agentStore.getLorebookEntriesForAgent(activeAgent.id),
        ];
        worldEntries.forEach((entry) => {
          if (entry.enabled && entry.content) {
            finalMessages.push({
              role: "system",
              content: `[World Info: ${entry.content}]`,
            });
          }
        });
      }
    } else {
      if (promptModule.content) {
        finalMessages.push({
          role: promptModule.role || "system",
          content: replacePlaceholders(promptModule.content),
        });
      }
    }
  });

  return finalMessages;
};

// --- 其他所有函数和生命周期钩子保持您现有的逻辑不变 ---

const executeApiCall = async (regenerateFromMessage = null) => {
  isLoading.value = true;
  if (regenerateFromMessage) {
    chat.trimHistory(regenerateFromMessage.id);
  }
  const provider = settings.activeModel.provider;
  const config = settings.providerConfig[provider];
  const finalMessages = buildFinalMessages(regenerateFromMessage);

  console.log("最终发送的上下文:", JSON.parse(JSON.stringify(finalMessages))); // 调试日志

  try {
    let response;
    if (provider === "gemini") {
      const contentsForAPI = {
        contents: finalMessages.map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })),
      };
      response = await api.gemini.fetchGeminiCompletion(
        settings.activeModel.modelName,
        contentsForAPI,
        config.apiKey
      );

      if (response.candidates && response.candidates[0]?.content?.parts) {
        chat.addMessage({
          role: "assistant",
          content: response.candidates[0].content.parts[0].text.trim(),
        });
      } else {
        const finishReason = response.candidates?.[0]?.finishReason || "未知";
        chat.addMessage({
          role: "assistant",
          content: `模型返回了空内容或因安全原因被拦截。完成原因: ${finishReason}`,
        });
      }
    } else {
      const params = {
        model: settings.activeModel.modelName,
        messages: finalMessages,
      };
      let fetchFunc = api[provider].fetchChatCompletion;
      if (provider === "custom")
        fetchFunc = api.custom.fetchCustomChatCompletion;
      response = await fetchFunc(
        params,
        config.apiKey,
        config.baseURL || undefined
      );
      chat.addMessage(response.choices[0].message);
    }
  } catch (error) {
    console.error("API 调用失败:", error);
    chat.addMessage({
      role: "assistant",
      content: `获取回复失败: ${
        error.response?.data?.error?.message || error.message
      }`,
    });
  } finally {
    isLoading.value = false;
  }
};

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return;
  if (!agentStore.activeAgent) {
    alert("请先到“角色”页面选择一个聊天对象！");
    return;
  }
  chat.addMessage({ role: "user", content: userInput.value });
  userInput.value = "";
  await executeApiCall();
};

const handleSwitchChat = (chatId) => {
  const targetChat = chat.chats.find((c) => c.id === chatId);
  if (targetChat && targetChat.agentId !== agentStore.activeAgentId) {
    agentStore.activeAgentId = targetChat.agentId;
  }
  chat.activeChatId = chatId;
  isMenuOpen.value = false;
};

const handleNewChat = () => {
  if (!agentStore.activeAgent) {
    alert("请先选择一个智能体！");
    return;
  }
  chat.startNewChat(agentStore.activeAgent);
  isMenuOpen.value = false;
};

watch(
  () => agentStore.activeAgentId,
  (newId) => {
    if (newId) {
      chat.ensureChatExists(agentStore.activeAgent);
    }
  },
  { immediate: true }
);

const handleRegenerate = (message = null) => {
  isMenuOpen.value = false;
  if (isLoading.value) return;

  if (!message) {
    const lastUserMessageIndex = chat.activeChatHistory
      .map((m) => m.role)
      .lastIndexOf("user");
    if (lastUserMessageIndex !== -1) {
      message = chat.activeChatHistory[lastUserMessageIndex];
    }
  }

  if (message) {
    executeApiCall(message);
  } else {
    executeApiCall();
  }
};

const handleToggleSelectionMode = () => {
  chat.toggleSelectionMode();
  if (!chat.isSelectionModeActive) {
    isMenuOpen.value = false;
  }
};
const handleDeleteSelected = () => {
  if (chat.selectedMessages.size > 0) {
    if (confirm(`确认删除选中的 ${chat.selectedMessages.size} 条消息吗？`)) {
      chat.deleteSelectedMessages();
    }
  }
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
onMounted(() => {
  scrollToBottom();
});
</script>

<style scoped>
/* 您的样式，保持原样 */
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
.chat-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #888;
  font-size: 1.2rem;
}
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #09f;
  margin-top: 1rem;
  animation: spin 1s ease infinite;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
