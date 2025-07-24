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
            <li class="separator"></li>
            <li class="menu-header">选择聊天记录</li>
            <div class="chat-history-list">
              <!-- (关键修改) 循环渲染聊天列表，并为每个条目添加删除按钮 -->
              <li
                v-for="chatSession in chat.chats"
                :key="chatSession.id"
                :class="{ active: chatSession.id === chat.activeChatId }"
              >
                <span
                  class="chat-name"
                  @click="handleSwitchChat(chatSession.id)"
                >
                  {{ chatSession.name }}
                </span>
                <!-- 为删除按钮绑定正确的 chatSession.id -->
                <button
                  @click.stop="
                    handleDeleteChat(chatSession.id, chatSession.name)
                  "
                  class="delete-chat-btn"
                  title="删除此聊天"
                >
                  🗑️
                </button>
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
const isMenuOpen = ref(false);

// ... buildFinalMessages 和 sendMessage 函数保持不变 ...
const buildFinalMessages = () => {
  const finalMessages = [];
  const activePreset = presets.activePreset;
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
  finalMessages.push(...currentHistory);
  finalMessages.push({ role: "user", content: lastMessage });
  return finalMessages;
};
const sendMessage = async () => {
  if (!userInput.value || isLoading.value) return;
  const provider = settings.activeModel.provider;
  const config = settings.providerConfig[provider];
  if (!config || !config.apiKey) {
    alert(`请先在设置页面配置 ${provider.toUpperCase()} 的 API Key!`);
    return;
  }
  isLoading.value = true;
  chat.addMessage({ role: "user", content: userInput.value });
  userInput.value = "";
  const finalMessages = buildFinalMessages();
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

// --- 聊天管理菜单的事件处理函数 (关键修改) ---
const handleNewChat = () => {
  chat.startNewChat();
  isMenuOpen.value = false;
};

// (关键修改) handleDeleteChat 现在接收 chatId 和 chatName 作为参数
const handleDeleteChat = (chatId, chatName) => {
  if (confirm(`你确定要删除聊天 "${chatName}" 吗？这个操作无法撤销。`)) {
    chat.deleteChat(chatId); // 调用 store 中正确的删除 action
  }
  // 不需要关闭菜单，以便用户可以连续删除
  // isMenuOpen.value = false;
};

const handleSwitchChat = (chatId) => {
  chat.switchChat(chatId);
  isMenuOpen.value = false;
};

const handleAttachFile = () => {
  alert("附加文件功能正在开发中！");
  isMenuOpen.value = false;
};

// ... watch 和 onMounted 保持不变 ...
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
/* 原有样式保持不变，只增加和修改新样式 */
.chat-input-area {
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
  display: flex; /* (关键修改) 使用 flex 布局来对齐内容 */
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
}
.dropdown-menu li:hover {
  background-color: #f0f2f5;
}
.dropdown-menu li.separator {
  height: 1px;
  background-color: #e9ecef;
  margin: 0.5rem 0;
  padding: 0;
  display: block;
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
.chat-name {
  flex-grow: 1; /* (关键新增) 让聊天名称占据大部分空间 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.delete-chat-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: #6c757d;
  padding: 0 0.5rem;
  display: none; /* 默认隐藏 */
}
/* (关键新增) 当鼠标悬停在列表项上时，显示删除按钮 */
.dropdown-menu li:hover .delete-chat-btn {
  display: inline-block;
}
.delete-chat-btn:hover {
  color: #dc3545;
}

/* 其他样式 */
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
