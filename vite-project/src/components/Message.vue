<template>
  <div class="message-item" :class="item.role">
    <div class="avatar">
      <!-- 不再使用 img 标签，而是用 div 显示首字母 -->
      <div class="avatar-initials" :style="{ backgroundColor: avatarColor }">
        {{ avatarInitial }}
      </div>
    </div>
    <div class="message-content">
      <div class="text" v-html="renderedContent"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import MarkdownIt from "markdown-it";

// 定义 props
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

// 初始化 markdown-it
const md = new MarkdownIt();

// 计算属性：根据角色返回首字母
const avatarInitial = computed(() => {
  return props.item.role === "user" ? "U" : "G";
});

// 计算属性：根据角色返回不同的头像背景色
const avatarColor = computed(() => {
  return props.item.role === "user" ? "#7b68ee" : "#4caf50";
});

// 计算属性：将 Markdown 内容渲染为 HTML
const renderedContent = computed(() => {
  return md.render(props.item.content);
});
</script>

<style scoped>
.message-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 85%;
}

/* 这是新的头像样式 */
.avatar {
  flex-shrink: 0;
}
.avatar-initials {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-content {
  padding: 10px 15px;
  border-radius: 12px;
  background-color: #ffffff;
  word-wrap: break-word;
  word-break: break-all;
}

.message-item.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-item.user .message-content {
  background-color: #a5e69d;
}

.message-item.assistant {
  align-self: flex-start;
}

.text {
  font-size: 1rem;
  line-height: 1.6;
}

/* 对 v-html 渲染出来的内容进行样式穿透 */
.text :deep(p) {
  margin: 0 0 10px 0;
}
.text :deep(p):last-child {
  margin-bottom: 0;
}
.text :deep(pre) {
  background-color: #282c34;
  color: #abb2bf;
  padding: 1em;
  border-radius: 8px;
  overflow-x: auto;
}
.text :deep(code) {
  font-family: "Courier New", Courier, monospace;
}
</style>
