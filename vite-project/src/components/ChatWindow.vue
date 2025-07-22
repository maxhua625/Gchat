<template>
  <div class="chat-container">
    <div class="chat-header">
      <h1>Gchat</h1>
      <p>Powered by Vite + Vue</p>
    </div>

    <div class="message-list" ref="messageListRef">
      <!-- 现在这里变得非常简洁，直接使用 Message 组件 -->
      <Message v-for="(item, index) in history" :key="index" :item="item" />
      <!-- 加载提示 -->
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
import { ref, onMounted, nextTick } from "vue";
// 正确地从 @/components 路径导入 Message 组件
import Message from "@/components/Message.vue";
// 引入我们封装好的统一 API 模块
import api from "@/api";

const history = ref([]);
const userInput = ref("");
const isLoading = ref(false);
const messageListRef = ref(null);

const sendMessage = async () => {
  if (!userInput.value || isLoading.value) return;

  isLoading.value = true;
  const userMessageContent = userInput.value;
  userInput.value = "";

  history.value.push({ role: "user", content: userMessageContent });
  await scrollToBottom();

  const messagesForAPI = history.value
    .filter((msg) => ["system", "user", "assistant"].includes(msg.role))
    .map((msg) => ({ role: msg.role, content: msg.content }));

  try {
    const response = await api.openai.fetchOpenAIChatCompletion({
      messages: messagesForAPI,
    });

    if (response.choices && response.choices.length > 0) {
      const assistantMessage = response.choices[0].message;
      history.value.push({
        role: assistantMessage.role,
        content: assistantMessage.content.trim(),
      });
    } else {
      throw new Error("Invalid response format from API.");
    }
  } catch (error) {
    console.error("Failed to fetch chat completion:", error);
    history.value.push({
      role: "assistant",
      content: `抱歉，出错了: ${error.message || "无法连接到服务器。"}`,
    });
  } finally {
    isLoading.value = false;
    await scrollToBottom();
  }
};

const scrollToBottom = async () => {
  await nextTick();
  const messageList = messageListRef.value;
  if (messageList) {
    messageList.scrollTop = messageList.scrollHeight;
  }
};

onMounted(() => {
  history.value.push({
    role: "assistant",
    content: "你好！有什么可以帮助你的吗？",
  });
  scrollToBottom();
});
</script>

<style scoped>
/* 这里只保留属于 ChatView 的宏观布局样式 */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 768px;
  margin: 0 auto;
  background-color: #f0f2f5;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.chat-header {
  padding: 1rem;
  background-color: #ffffff;
  border-bottom: 1px solid #d9d9d9;
  text-align: center;
  flex-shrink: 0;
}

.chat-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.chat-header p {
  margin: 0;
  color: #888;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loading-indicator {
  align-self: flex-start;
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
}

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
  transition: background-color 0.3s;
}

.input-form button:hover {
  background-color: #45a049;
}

.input-form button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>
