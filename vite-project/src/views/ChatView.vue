<template>
  <div class="chat-view">
    <ChatWindow
      :messages="store.messages"
      :is-generating="store.isGenerating"
      @send-message="handleSendMessage"
      @stop-generating="handleStop"
    />
  </div>
</template>

<script setup>
import { ElMessage } from "element-plus";
import ChatWindow from "../components/ChatWindow.vue";
import { fetchChatStream, stopGenerating } from "../api/chat";
// 导入全局状态
import { store } from "../store";

const handleStop = () => {
  stopGenerating();
  store.isGenerating = false;
};

const handleSendMessage = async (userInput) => {
  if (!store.apiConfig.url || !store.apiConfig.model) {
    ElMessage.warning("请先在“设置”页面完成 API 和模型设置！");
    return;
  }

  store.isGenerating = true;

  const userMessage = { id: Date.now(), role: "user", content: userInput };
  store.messages.push(userMessage);

  let apiMessages = [];
  let systemContent = store.agent.systemPrompt || "";
  if (store.agent.worldBook) {
    systemContent += `\n\n--- 背景知识 ---\n${store.agent.worldBook}`;
  }
  if (systemContent.trim()) {
    apiMessages.push({ role: "system", content: systemContent });
  }

  // 只传递消息内容，不传递id等前端特有的属性
  const history = store.messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  apiMessages = apiMessages.concat(history);

  const aiMessageId = Date.now() + 1;
  const aiMessage = { id: aiMessageId, role: "assistant", content: "" };
  store.messages.push(aiMessage);

  await fetchChatStream({
    apiUrl: store.apiConfig.url,
    apiKey: store.apiConfig.key,
    model: store.apiConfig.model,
    messages: apiMessages,
    onStream: (chunk) => {
      const msgIndex = store.messages.findIndex((m) => m.id === aiMessageId);
      if (msgIndex !== -1) {
        store.messages[msgIndex].content += chunk;
      }
    },
    onFinish: () => {
      store.isGenerating = false;
    },
    onError: (errMsg) => {
      store.isGenerating = false;
      ElMessage.error(`请求出错: ${errMsg}`);
      const msgIndex = store.messages.findIndex((m) => m.id === aiMessageId);
      if (msgIndex !== -1) {
        store.messages[msgIndex].content += `\n\n**错误:** 请求失败。`;
      }
    },
  });
};
</script>

<style scoped>
.chat-view {
  height: 100vh; /* 确保聊天视图占满整个容器高度 */
}
</style>
