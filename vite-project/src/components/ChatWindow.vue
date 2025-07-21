<template>
  <div class="chat-window">
    <div class="message-list" ref="messageListRef">
      <div
        v-for="message in messages"
        :key="message.id"
        class="message-item"
        :class="`message-${message.role}`"
      >
        <div class="avatar">{{ message.role === "user" ? "You" : "AI" }}</div>
        <div class="content" v-html="renderMarkdown(message.content)"></div>
      </div>
    </div>
    <div class="input-area">
      <el-input
        v-model="userInput"
        placeholder="输入你的消息..."
        @keyup.enter="handleSendMessage"
        :disabled="isGenerating"
      >
        <template #append>
          <el-button
            @click="handleSendMessage"
            :disabled="!userInput.trim() || isGenerating"
            >发送</el-button
          >
        </template>
      </el-input>
      <el-button
        v-if="isGenerating"
        @click="handleStopGenerating"
        type="danger"
        style="margin-left: 10px"
        >停止</el-button
      >
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from "vue";
import { stopGenerating } from "../api/chat";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt();
const renderMarkdown = (content) => md.render(content);

const props = defineProps({
  messages: {
    type: Array,
    required: true,
  },
  isGenerating: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["send-message", "stop-generating"]);

const userInput = ref("");
const messageListRef = ref(null);

const handleSendMessage = () => {
  if (!userInput.value.trim()) return;
  emit("send-message", userInput.value);
  userInput.value = "";
};

const handleStopGenerating = () => {
  emit("stop-generating");
};

const scrollToBottom = async () => {
  await nextTick();
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
  }
};

watch(() => props.messages, scrollToBottom, { deep: true });
watch(() => props.messages.slice(-1)[0]?.content, scrollToBottom);
</script>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
}
.message-list {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
}
.message-item {
  display: flex;
  margin-bottom: 20px;
  max-width: 80%;
}
.message-user {
  margin-left: auto;
  flex-direction: row-reverse;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  flex-shrink: 0;
}
.message-assistant .avatar {
  background-color: #67c23a;
}
.message-user .avatar {
  margin-left: 15px;
  margin-right: 0;
}
.content {
  padding: 10px 15px;
  background-color: #f4f4f5;
  border-radius: 10px;
  word-wrap: break-word;
  white-space: pre-wrap;
}
.message-user .content {
  background-color: #d9ecff;
}
.input-area {
  display: flex;
  padding: 20px;
  border-top: 1px solid #dcdfe6;
  background-color: #fff;
}
</style>
