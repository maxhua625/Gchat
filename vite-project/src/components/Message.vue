<template>
  <!-- (关键修改) 整个包裹器根据角色应用不同的 class -->
  <div class="message-wrapper" :class="`role-${item.role}`">
    <!-- 复选框，现在会根据父元素的 flex 布局自动定位 -->
    <input
      v-if="chat.isSelectionModeActive"
      type="checkbox"
      class="message-checkbox"
      :checked="isSelected"
      @change="toggleSelection"
    />

    <!-- 消息体 -->
    <div class="message-item" :class="item.role">
      <div class="avatar">
        <div class="avatar-initials" :style="{ backgroundColor: avatarColor }">
          {{ avatarInitial }}
        </div>
      </div>
      <div class="message-content">
        <div class="message-header">
          <span class="floor-number">#{{ floor }}</span>
          <button @click="startEditing" class="edit-button" title="编辑">
            ✏️
          </button>
        </div>

        <div v-if="isEditing" class="edit-area">
          <textarea
            v-model="editableContent"
            class="edit-textarea"
            ref="editInputRef"
          ></textarea>
          <div class="edit-actions">
            <button @click="saveEdit">保存</button>
            <button @click="cancelEdit">取消</button>
          </div>
        </div>
        <div v-else class="text" v-html="renderedContent"></div>

        <div
          v-if="item.role === 'assistant' && !isEditing"
          class="message-actions"
        >
          <button @click="emitRegenerate" title="重新生成">🔄</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick } from "vue";
import MarkdownIt from "markdown-it";
import { useChatStore } from "@/stores/chatStore";

const props = defineProps({
  item: { type: Object, required: true },
  floor: { type: Number, required: true },
});

const emit = defineEmits(["regenerate"]);
const chat = useChatStore();
const md = new MarkdownIt();
const editInputRef = ref(null);

const isEditing = computed(() => chat.editingMessageId === props.item.id);
const editableContent = ref(props.item.content);
const isSelected = computed(() => chat.selectedMessages.has(props.item.id));
const avatarInitial = computed(() => (props.item.role === "user" ? "U" : "G"));
const avatarColor = computed(() =>
  props.item.role === "user" ? "#7b68ee" : "#4caf50"
);
const renderedContent = computed(() => md.render(props.item.content));

const toggleSelection = () => {
  chat.toggleMessageSelection(props.item.id);
};
const emitRegenerate = () => {
  emit("regenerate");
};

const startEditing = () => {
  editableContent.value = props.item.content;
  chat.editingMessageId = props.item.id;
  nextTick(() => {
    editInputRef.value?.focus();
  });
};

const saveEdit = () => {
  chat.updateMessageContent(props.item.id, editableContent.value);
  chat.editingMessageId = null;
};

const cancelEdit = () => {
  chat.editingMessageId = null;
};
</script>

<style scoped>
/* (关键修改) 这是本次修改的核心 */
.message-wrapper {
  display: flex;
  align-items: flex-start; /* 垂直方向上对齐项目的起始位置 */
  gap: 8px;
  width: 100%;
}

.message-wrapper.role-user {
  justify-content: flex-end; /* 让所有子元素作为一个整体靠右对齐 */
}

/* (关键修改) 消息体内部也需要调整，让用户头像在右边 */
.message-item.user {
  flex-direction: row-reverse;
}

/* --- 原有样式，做了微调以适应新布局 --- */
.message-checkbox {
  margin-top: 12px;
  cursor: pointer;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 80%; /* 限制消息的最大宽度 */
}

.message-content {
  padding: 10px 15px;
  border-radius: 12px;
  background-color: #ffffff;
  width: 100%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-item.user .message-content {
  background-color: #dcf8c6; /* 用户的消息气泡颜色 */
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  color: #999;
  font-size: 0.8em;
}

.edit-button {
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0; /* 默认隐藏 */
  padding: 0;
  transition: opacity 0.2s;
}

.message-item:hover .edit-button {
  opacity: 1; /* 鼠标悬停在消息体上时显示 */
}

.edit-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-textarea {
  width: 100%;
  min-height: 100px;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px;
  font-family: inherit;
  font-size: 1rem;
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.edit-actions button {
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid #ccc;
  cursor: pointer;
}

.message-actions {
  text-align: right;
  margin-top: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-item:hover .message-actions {
  opacity: 1;
}

.message-actions button {
  background: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  padding: 2px 6px;
}

/* --- 底层样式，无需改动 --- */
.avatar {
  flex-shrink: 0;
}
.avatar-initials {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: #fff;
  font-weight: 700;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.text {
  font-size: 1rem;
  line-height: 1.6;
}
.text :deep(p) {
  margin: 0 0 10px;
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
