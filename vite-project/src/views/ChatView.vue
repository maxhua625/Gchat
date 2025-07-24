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
      <!-- (关键修改) 渲染当前激活的聊天历史 -->
      <Message
        v-for="(item, index) in chat.activeChatHistory"
        :key="index"
        :item="item"
      />
      <div v-if="isLoading" class="loading-indicator">
        <Message :item="{ role: 'assistant', content: '...' }" />
      </div>
    </div>

    <div class="chat-input-area">
      <!-- (关键新增) 聊天管理菜单 -->
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
            <li @click="handleDeleteChat" class="delete-option">
              🗑️ 删除当前聊天
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
import { ref, onMounted, nextTick, watch } from "vue";
import Message from "@/components/Message.vue";
import api from "@/api";
import { useChatStore } from "@/stores/chatStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { usePresetsStore } from "@/stores/presetsStore";
import { useWorldbookStore } from "@/stores/worldbookStore";

const chat = useChatStore();
const settings = useSettingsStore();
const presets = usePresetsStore();
const worldbook = useWorldbookStore();

const userInput = ref("");
const isLoading = ref(false);
const messageListRef = ref(null);
const isMenuOpen = ref(false); // 控制菜单的显示和隐藏

// --- (关键修改) 使用新的 store 逻辑 ---
const buildFinalMessages = () => {
  const finalMessages = [];
  const activePreset = presets.activePreset;
  // (关键修改) 注意：这里我们使用 activeChatHistory，但排除最后一个用户消息，因为 userInput 才是最新的
  const currentHistory = chat.activeChatHistory.slice(0, -1);
  const lastMessage =
    chat.activeChatHistory[chat.activeChatHistory.length - 1]?.content || "";

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

  // (关键修改) 添加当前会话的历史记录
  finalMessages.push(...currentHistory);
  finalMessages.push({ role: "user", content: lastMessage }); // 确保最新的用户消息在最后

  return finalMessages;
};

const sendMessage = async () => {
  if (!userInput.value || isLoading.value) return;

  // ... (provider 和 config 的获取逻辑保持不变)
  const provider = settings.activeModel.provider;
  const config = settings.providerConfig[provider];
  // ...

  isLoading.value = true;

  // (关键修改) 使用 store 的 action 添加消息到当前会话
  chat.addMessage({ role: "user", content: userInput.value });
  userInput.value = ""; // 清空输入框

  const finalMessages = buildFinalMessages();

  // ... (try...catch...finally 块中的 API 调用逻辑保持不变)
  try {
    let response;
    const activePreset = presets.activePreset;
    const modelParams = {
      model: settings.activeModel.modelName /* ...其他参数 */,
    };
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
      const params = { ...modelParams, messages: finalMessages };
      let fetchFunc;
      if (provider === "custom") {
        fetchFunc = api.custom.fetchCustomChatCompletion;
        response = await fetchFunc(params, config.apiKey, config.baseURL);
      } else {
        fetchFunc =
          api[provider].fetchOpenAIChatCompletion ||
          api[provider].fetchDeepseekChatCompletion;
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

const scrollToBottom = async () => {
  await nextTick();
  const listEl = messageListRef.value;
  if (listEl) listEl.scrollTop = listEl.scrollHeight;
};

// --- (关键新增) 聊天管理菜单的事件处理函数 ---
const handleNewChat = () => {
  chat.startNewChat();
  isMenuOpen.value = false;
};

const handleDeleteChat = () => {
  if (
    confirm(
      `你确定要删除当前聊天 "${chat.activeChat.name}" 吗？这个操作无法撤销。`
    )
  ) {
    chat.deleteChat(chat.activeChatId);
  }
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

// 监听当前激活的聊天历史长度变化，自动滚动
watch(
  () => chat.activeChatHistory.length,
  () => {
    scrollToBottom();
  }
);

onMounted(() => {
  // (关键修改) 确保应用加载时，至少存在一个聊天会话
  chat.ensureChatExists();
  scrollToBottom();
});
</script>

<style scoped>
/* (关键新增) 聊天管理菜单的样式 */
.chat-input-area {
  /* ... 原有样式 ... */
  display: flex; /* 改为 flex 布局 */
  align-items: center; /* 垂直居中 */
}
.chat-actions {
  position: relative; /* 为下拉菜单定位 */
  margin-right: 0.5rem; /* 与输入框的间距 */
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
  bottom: 50px; /* 定位在按钮上方 */
  left: 0;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 220px;
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
  font-weight: bold;
  color: #6c757d;
  padding: 0.5rem 1rem;
  font-size: 0.9em;
  cursor: default;
}
.dropdown-menu li.menu-header:hover {
  background: none;
}
.chat-history-list {
  max-height: 150px;
  overflow-y: auto;
}
.chat-history-list li.active {
  background-color: #007bff;
  color: white;
}

/* 原有样式保持不变 */
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
