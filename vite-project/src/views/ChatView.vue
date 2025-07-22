<template>
  <div class="chat-wrapper">
    <!-- 顶部信息栏，显示当前使用的模型 -->
    <div class="chat-info-header">
      当前模型:
      <strong
        >{{ settings.activeModel.provider }} /
        {{ settings.activeModel.modelName }}</strong
      >
    </div>

    <div class="message-list" ref="messageListRef">
      <Message
        v-for="(item, index) in chat.history"
        :key="index"
        :item="item"
      />
      <div v-if="isLoading" class="loading-indicator">
        <Message :item="{ role: 'assistant', content: '...' }" />
      </div>
    </div>

    <div class="chat-input-area">
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

// 1. 导入并使用 stores
import { useChatStore } from "@/store/chatStore";
import { useSettingsStore } from "@/store/settingsStore";

const chat = useChatStore();
const settings = useSettingsStore();

const userInput = ref("");
const isLoading = ref(false);
const messageListRef = ref(null);

const sendMessage = async () => {
  if (!userInput.value || isLoading.value) return;

  const provider = settings.activeModel.provider;
  const apiKey = settings[provider]?.apiKey;

  if (!apiKey) {
    alert(`请先在设置页面配置 ${provider.toUpperCase()} 的 API Key!`);
    return;
  }

  isLoading.value = true;
  const userMessageContent = userInput.value;
  userInput.value = "";

  // 2. 使用 store 的 action 添加消息
  chat.addMessage({ role: "user", content: userMessageContent });

  try {
    let response;
    const currentHistory = JSON.parse(JSON.stringify(chat.history));

    if (provider === "openai") {
      const messagesForAPI = currentHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      response = await api.openai.fetchOpenAIChatCompletion(
        {
          messages: messagesForAPI,
          model: settings.activeModel.modelName,
        },
        apiKey
      ); // 传递 apiKey
      chat.addMessage(response.choices[0].message);
    } else if (provider === "gemini") {
      const contentsForAPI = {
        contents: currentHistory.map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })),
      };
      // Gemini API 不需要单独传模型名称，因为它在 URL 里
      response = await api.gemini.fetchGeminiCompletion(contentsForAPI, apiKey); // 传递 apiKey
      const assistantMessageText = response.candidates[0].content.parts[0].text;
      chat.addMessage({
        role: "assistant",
        content: assistantMessageText.trim(),
      });
    }
  } catch (error) {
    const errorMessage = `获取回复失败: ${
      error.response?.data?.error?.message || error.message
    }`;
    chat.addMessage({ role: "assistant", content: errorMessage });
    console.error(errorMessage);
  } finally {
    isLoading.value = false;
  }
};

const scrollToBottom = async () => {
  await nextTick();
  const listEl = messageListRef.value;
  if (listEl) {
    listEl.scrollTop = listEl.scrollHeight;
  }
};

// 3. 监听 history 的变化，自动滚动
watch(
  () => chat.history.length,
  () => {
    scrollToBottom();
  }
);

onMounted(() => {
  scrollToBottom();
});
</script>

<!-- 为了方便，我将样式移动到了 ChatView.vue 中，因为 ChatWrapper 现在是逻辑上的 chat 页面 -->
<style scoped>
.chat-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%; /* 占满 main 区域的高度 */
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
  background-color: #ffffff;
  border-top: 1px solid #d9d9d9;
  flex-shrink: 0;
}
.input-form {
  display: flex;
  gap: 0.5rem;
  max-width: 800px;
  margin: 0 auto;
}
/* 其他样式保持不变 */
.input-form input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
}
.input-form input:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}
.input-form button {
  padding: 0.75rem 1.5rem;
  border: none;
  background-color: #4caf50;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}
.input-form button:disabled {
  background-color: #cccccc;
}
</style>
