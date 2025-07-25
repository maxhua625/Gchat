<template>
  <div class="chat-wrapper">
    <div class="chat-info-header">
      当前模型:
      <strong
        >{{ settings.activeModel.provider }} /
        {{ settings.activeModel.modelName }}</strong
      >
      | 当前预设: <strong>{{ presets.activePreset.name }}</strong>
    </div>

    <div class="message-list" ref="messageListRef">
      <!-- (关键修改) 传递 floor 属性 -->
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
            <!-- (关键修改) 菜单项更新 -->
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
            <li class="menu-header">选择聊天记录</li>
            <div class="chat-history-list">
              <li
                v-for="chatSession in chat.chats"
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

      <form @submit.prevent="sendMessage(userInput)" class="input-form">
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
// ... 其他 import 保持不变
import { ref, onMounted, nextTick, watch } from "vue";
import Message from "@/components/Message.vue";
import api from "@/api";
import { useChatStore } from "@/stores/chatStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { usePresetsStore } from "@/stores/presetsStore";
import { useWorldbookStore } from "@/stores/worldbookStore";

const chat = useChatStore();
// ... 其他 store
const settings = useSettingsStore();
const presets = usePresetsStore();
const worldbook = useWorldbookStore();

const userInput = ref("");
const isLoading = ref(false);
const messageListRef = ref(null);
const isMenuOpen = ref(false);

// ... sendMessage, buildFinalMessages, executeApiCall 保持不变
const buildFinalMessages = () => {
  const finalMessages = [];
  const activePreset = presets.activePreset;
  const currentHistory = chat.activeChatHistory;
  const lastMessage =
    currentHistory.length > 0
      ? currentHistory[currentHistory.length - 1].content
      : "";
  worldbook.entries.forEach((entry) => {
    if (entry.enabled) {
      const keywords = entry.keys.split(",").map((k) => k.trim());
      if (entry.isGlobal || keywords.some((k) => lastMessage.includes(k))) {
        finalMessages.push({
          role: "system",
          content: `[World Info: ${entry.content}]`,
        });
      }
    }
  });
  if (activePreset && activePreset.prompts) {
    activePreset.prompts.forEach((prompt) => {
      if (prompt.enabled && prompt.content) {
        finalMessages.push({
          role: prompt.role || "system",
          content: prompt.content,
        });
      }
    });
  }
  finalMessages.push(...currentHistory);
  return finalMessages;
};
const executeApiCall = async () => {
  isLoading.value = true;
  const provider = settings.activeModel.provider;
  const config = settings.providerConfig[provider];
  const finalMessages = buildFinalMessages();
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
      chat.addMessage({
        role: "assistant",
        content: response.candidates[0].content.parts[0].text.trim(),
      });
    } else {
      const params = {
        model: settings.activeModel.modelName,
        messages: finalMessages,
      };
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
const sendMessage = async (messageContent) => {
  if (!messageContent || isLoading.value) return;
  const provider = settings.activeModel.provider;
  const config = settings.providerConfig[provider];
  if (!config || !config.apiKey) {
    alert(`请先在设置页面配置 ${provider.toUpperCase()} 的 API Key!`);
    return;
  }
  chat.addMessage({ role: "user", content: messageContent });
  userInput.value = "";
  await executeApiCall();
};

// --- (关键修改) 新的菜单事件处理函数 ---
const handleToggleSelectionMode = () => {
  chat.toggleSelectionMode();
  // 如果不是为了删除，只是单纯退出选择模式，则不需要关闭整个菜单
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
  } else {
    // 理论上不会触发，因为按钮被 v-if 控制了
    alert("没有选中的消息。");
  }
  isMenuOpen.value = false;
};

const handleRegenerate = () => {
  isMenuOpen.value = false;
  if (isLoading.value) return;
  chat.removeLastAssistantMessage();
  executeApiCall();
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

// --- 生命周期钩子和 Watcher ---
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
  chat.ensureChatExists();
  scrollToBottom();
});
</script>

<style scoped>
/* 原有样式保持不变，只微调 */
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
  font-weight: bold;
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
