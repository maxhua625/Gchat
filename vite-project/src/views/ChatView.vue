<template>
  <div class="chat-container">
    <div class="chat-header">
      <h1>Gchat</h1>
      <!-- 新增：模型选择器 -->
      <div class="model-selector">
        <label for="model">当前模型: </label>
        <select v-model="selectedModel" id="model">
          <option value="openai">OpenAI (GPT-3.5)</option>
          <option value="gemini">Google (Gemini Pro)</option>
        </select>
      </div>
    </div>

    <div class="message-list" ref="messageListRef">
      <Message v-for="(item, index) in history" :key="index" :item="item" />
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
import Message from "@/components/Message.vue";
import api from "@/api";

// 新增：用于存储当前选择的模型，默认为 openai
const selectedModel = ref("openai");

const history = ref([]);
const userInput = ref("");
const isLoading = ref(false);
const messageListRef = ref(null);

/**
 * 核心发送函数，现在支持多模型
 */
const sendMessage = async () => {
  if (!userInput.value || isLoading.value) return;

  isLoading.value = true;
  const userMessageContent = userInput.value;
  userInput.value = "";

  history.value.push({ role: "user", content: userMessageContent });
  await scrollToBottom();

  try {
    let response;
    // 根据选择的模型，调用不同的 API
    if (selectedModel.value === "openai") {
      // --- OpenAI 的逻辑 ---
      // 1. 准备 OpenAI 需要的 messages 数组格式
      const messagesForAPI = history.value.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // 2. 调用 OpenAI 的 API
      response = await api.openai.fetchOpenAIChatCompletion({
        messages: messagesForAPI,
      });

      // 3. 解析 OpenAI 的响应
      if (response.choices && response.choices.length > 0) {
        // 直接将返回的 message 对象推入历史记录
        history.value.push(response.choices[0].message);
      } else {
        throw new Error("从 OpenAI API 返回的数据格式无效。");
      }
    } else if (selectedModel.value === "gemini") {
      // --- Gemini 的逻辑 ---
      // 1. 准备 Gemini 需要的 contents 数组格式
      const contentsForAPI = {
        contents: history.value.map((msg) => ({
          // Gemini 使用 'user' 和 'model' 作为角色
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })),
      };

      // 2. 调用 Gemini 的 API
      response = await api.gemini.fetchGeminiCompletion(contentsForAPI);

      // 3. 解析 Gemini 的响应
      if (
        response.candidates &&
        response.candidates.length > 0 &&
        response.candidates[0].content
      ) {
        const assistantMessageText =
          response.candidates[0].content.parts[0].text;
        history.value.push({
          role: "assistant",
          content: assistantMessageText.trim(),
        });
      } else {
        // 有时即使请求成功，Gemini也可能因为安全设置等原因返回不含内容的candidates
        throw new Error("从 Gemini API 返回的数据格式无效或内容被屏蔽。");
      }
    }
  } catch (error) {
    console.error(`从 ${selectedModel.value} 获取回复失败:`, error);
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
    content: "你好！请在上方选择一个模型，然后开始对话吧。",
  });
});
</script>

<style scoped>
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

/* 模型选择器的新增样式 */
.model-selector {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #555;
}
.model-selector select {
  margin-left: 8px;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #ccc;
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
