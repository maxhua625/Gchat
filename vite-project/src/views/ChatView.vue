<template>
  <div class="chat-container">
    <!-- 顶部标题栏 -->
    <div class="chat-header">
      <h1>Gchat</h1>
      <p>Powered by Vite + Vue</p>
    </div>

    <!-- 消息展示区域 -->
    <div class="message-list" ref="messageListRef">
      <div v-for="(item, index) in history" :key="index">
        <Message :item="item" />
      </div>
      <!-- 加载提示 -->
      <div v-if="isLoading" class="loading-indicator">
        <Message :item="{ role: 'assistant', content: '...' }" />
      </div>
    </div>

    <!-- 输入区域 -->
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
// 引入我们封装好的统一 API 模块
import api from "@/api";

// --- 响应式状态定义 ---

// 聊天记录
const history = ref([]);
// 用户输入框的内容
const userInput = ref("");
// 是否正在等待 API 响应
const isLoading = ref(false);
// 消息列表 DOM 元素的引用
const messageListRef = ref(null);

// --- 核心方法 ---

/**
 * 发送消息并获取 AI 回复
 */
const sendMessage = async () => {
  // 防止发送空消息或在加载时重复发送
  if (!userInput.value || isLoading.value) return;

  // 1. 更新状态
  isLoading.value = true;
  const userMessageContent = userInput.value;
  userInput.value = ""; // 清空输入框

  // 2. 将用户消息添加到聊天记录
  history.value.push({ role: "user", content: userMessageContent });
  await scrollToBottom();

  // 3. 准备发送到 API 的数据 (通常是包含历史记录的数组)
  // 注意：某些模型可能对历史记录长度有限制
  const messagesForAPI = history.value
    .filter((msg) => ["system", "user", "assistant"].includes(msg.role))
    .map((msg) => ({ role: msg.role, content: msg.content }));

  // 4. 调用封装好的 API 方法
  try {
    const response = await api.openai.fetchOpenAIChatCompletion({
      messages: messagesForAPI,
      // 如果需要流式输出，可以添加 stream: true
      // stream: true,
    });

    // 5. 处理 API 响应
    if (response.choices && response.choices.length > 0) {
      const assistantMessage = response.choices[0].message;
      history.value.push({
        role: assistantMessage.role,
        content: assistantMessage.content.trim(),
      });
    } else {
      // 处理 API 返回了数据但格式不正确的情况
      throw new Error("Invalid response format from API.");
    }
  } catch (error) {
    console.error("Failed to fetch chat completion:", error);
    // 在界面上向用户显示错误信息
    history.value.push({
      role: "assistant",
      content: `抱歉，出错了: ${error.message || "无法连接到服务器。"}`,
    });
  } finally {
    // 6. 结束加载状态
    isLoading.value = false;
    await scrollToBottom();
  }
};

/**
 * 将消息列表滚动到底部
 */
const scrollToBottom = async () => {
  // nextTick 确保 DOM 已经更新完毕
  await nextTick();
  const messageList = messageListRef.value;
  if (messageList) {
    messageList.scrollTop = messageList.scrollHeight;
  }
};

// --- 生命周期钩子 ---

onMounted(() => {
  // 组件挂载时，可以从 localStorage 加载历史记录（如果需要）
  const savedHistory = localStorage.getItem("chatHistory");
  if (savedHistory) {
    history.value = JSON.parse(savedHistory);
  } else {
    // 或者设置一条欢迎语
    history.value.push({
      role: "assistant",
      content: "你好！有什么可以帮助你的吗？",
    });
  }
  scrollToBottom();

  // 监听聊天记录的变化，并保存到 localStorage (可选)
  // watch(history, (newHistory) => {
  //   localStorage.setItem('chatHistory', JSON.stringify(newHistory));
  // }, { deep: true });
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
