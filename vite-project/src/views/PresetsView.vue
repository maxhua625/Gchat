<template>
  <div class="page-layout">
    <aside class="sidebar">
      <h3>预设列表</h3>
      <ul>
        <li
          v-for="(preset, index) in store.presetsList"
          :key="index"
          :class="{ active: store.activePresetIndex === index }"
          @click="store.activePresetIndex = index"
        >
          {{ preset.name || `预设 ${index + 1}` }}
          <button @click.stop="store.deletePreset(index)" class="delete-btn">
            ×
          </button>
        </li>
      </ul>
      <div class="sidebar-actions">
        <button @click="store.addNewPreset">新建预设</button>
        <button @click="triggerImport">导入预设 (.json)</button>
        <input
          type="file"
          ref="fileInput"
          @change="handleFileUpload"
          accept=".json"
          style="display: none"
        />
      </div>
    </aside>

    <main class="editor-content" v-if="activePreset">
      <div class="editor-header">
        <input
          type="text"
          v-model="activePreset.name"
          class="preset-name-input"
        />
      </div>

      <!-- (关键修改) 全面升级和中文化的模型参数区域 -->
      <section class="editor-section">
        <h4>模型参数</h4>
        <div class="param-grid">
          <!-- 数值型参数 -->
          <div class="form-group" v-for="param in modelParams" :key="param.key">
            <label :for="param.key" :title="param.description">{{
              param.label
            }}</label>
            <input
              :id="param.key"
              type="number"
              v-model.number="activePreset[param.key]"
              :step="param.step"
              :min="param.min"
              :max="param.max"
            />
          </div>
          <!-- 开关型参数 -->
          <div
            class="form-group switch-group"
            v-for="param in switchParams"
            :key="param.key"
          >
            <label :for="param.key" :title="param.description">{{
              param.label
            }}</label>
            <label class="switch">
              <input
                :id="param.key"
                type="checkbox"
                v-model="activePreset[param.key]"
              />
              <span class="slider round"></span>
            </label>
          </div>
        </div>
      </section>

      <section class="editor-section">
        <h4>提示词注入 (Prompts)</h4>
        <!-- 提示词表格保持不变 -->
        <div class="prompts-table-wrapper">
          <table>
            <thead>
              <tr>
                <th title="是否启用">启</th>
                <th>名称</th>
                <th>角色</th>
                <th class="content-col">内容</th>
                <th title="注入位置">位置</th>
                <th title="注入深度">深度</th>
                <th title="禁止覆盖">禁</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody @drop="handleDrop" @dragover.prevent @dragenter.prevent>
              <template
                v-for="(prompt, index) in activePreset.prompts"
                :key="index"
              >
                <tr
                  v-if="prompt.name && prompt.name.includes('——分隔线——')"
                  class="divider-row"
                >
                  <td colspan="8">
                    <div class="divider-content">
                      <span>{{ prompt.name }}</span>
                    </div>
                  </td>
                </tr>
                <tr
                  v-else
                  :draggable="true"
                  @dragstart="handleDragStart($event, index)"
                  @dragover="handleDragOver($event, index)"
                  @dragleave="handleDragLeave"
                  @dragend="handleDragEnd"
                  :class="[
                    getPromptRowClass(prompt),
                    { 'drag-over-highlight': dragOverIndex === index },
                  ]"
                  class="draggable-row"
                >
                  <td><input type="checkbox" v-model="prompt.enabled" /></td>
                  <td>
                    <input
                      type="text"
                      v-model="prompt.name"
                      class="table-input"
                    />
                  </td>
                  <td>
                    <select v-model="prompt.role" class="table-select">
                      <option>system</option>
                      <option>user</option>
                      <option>assistant</option>
                    </select>
                  </td>
                  <td class="content-col">
                    <textarea
                      v-model="prompt.content"
                      class="table-textarea"
                    ></textarea>
                  </td>
                  <td>
                    <input
                      type="number"
                      v-model.number="prompt.injection_position"
                      class="table-input-small"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      v-model.number="prompt.injection_depth"
                      class="table-input-small"
                    />
                  </td>
                  <td>
                    <input type="checkbox" v-model="prompt.forbid_overrides" />
                  </td>
                  <td>
                    <button
                      @click="deletePrompt(index)"
                      class="delete-btn-small"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <button @click="addPrompt" class="add-prompt-btn">添加新提示词</button>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { usePresetsStore } from "@/stores/presetsStore";

const store = usePresetsStore();
const fileInput = ref(null);
const draggedIndex = ref(null);
const dragOverIndex = ref(null);

// (关键修改) 更新参数列表并中文化
const modelParams = ref([
  {
    key: "temperature",
    label: "温度 (Temperature)",
    description: "随机性，值越高越随机，越富有创造力。",
    step: 0.01,
    min: 0,
    max: 2,
  },
  {
    key: "top_p",
    label: "核心采样 (Top P)",
    description: "保留概率最高的词汇，直到总概率达到该值。",
    step: 0.01,
    min: 0,
    max: 1,
  },
  {
    key: "top_k",
    label: "Top K",
    description: "在每一步生成中，只考虑 K 个最可能的词。",
    step: 1,
    min: 0,
  },
  {
    key: "repetition_penalty",
    label: "重复惩罚",
    description: "对重复出现的词进行惩罚，值越高越不易重复。",
    step: 0.01,
    min: 0,
  },
  {
    key: "frequency_penalty",
    label: "频率惩罚",
    description: "对出现频率高的词进行惩罚，降低模型生成常用词的概率。",
    step: 0.01,
    min: 0,
    max: 2,
  },
  {
    key: "presence_penalty",
    label: "存在惩罚",
    description: "对已出现过的词进行惩罚，鼓励模型引入新概念。",
    step: 0.01,
    min: 0,
    max: 2,
  },
  {
    key: "max_context_tokens",
    label: "上下文长度",
    description: "每次请求发送给模型的最大历史消息长度（以 Token 计）。",
    step: 1,
    min: 0,
  },
  {
    key: "max_tokens",
    label: "最大回复长度",
    description: "模型单次回复生成的最大 Token 数量。",
    step: 1,
    min: 0,
  },
  {
    key: "n",
    label: "备选回复数",
    description:
      "为一条用户消息生成 N 个不同的回复以供选择 (注意: 这会消耗 N 倍的 Token)。",
    step: 1,
    min: 1,
    max: 5,
  },
]);

const switchParams = ref([
  {
    key: "stream",
    label: "流式传输",
    description: "是否让模型以打字机的效果逐字返回内容。",
  },
  {
    key: "image_support",
    label: "发送图片",
    description: "（前端功能）是否允许在聊天框中发送图片（需要模型支持）。",
  },
  {
    key: "request_chain_of_thought",
    label: "请求思维链",
    description: "（前端功能）是否在请求中加入引导模型进行思考的指令。",
  },
]);

const activePreset = computed(() => store.activePreset);

// ... 其他函数 (getPromptRowClass, addPrompt, deletePrompt, triggerImport, handleFileUpload, 拖拽函数) 保持不变
const getPromptRowClass = (prompt) => {
  if (!prompt.name) return "";
  if (prompt.name.includes("✅")) return "prompt-type-exclusive";
  if (prompt.name.includes("🔓")) return "prompt-type-jailbreak";
  if (prompt.name.includes("☑️")) return "prompt-type-optional";
  if (prompt.name.includes("🔵")) return "prompt-type-semifixed";
  return "";
};
const addPrompt = () => {
  if (!activePreset.value.prompts) activePreset.value.prompts = [];
  activePreset.value.prompts.push({
    name: "新提示词",
    role: "system",
    content: "",
    enabled: true,
    injection_position: 0,
    injection_depth: 4,
    forbid_overrides: false,
  });
};
const deletePrompt = (index) => {
  activePreset.value.prompts.splice(index, 1);
};
const triggerImport = () => {
  fileInput.value.click();
};
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    store.importPreset(e.target.result);
    event.target.value = "";
  };
  reader.readAsText(file);
};
const handleDragStart = (event, index) => {
  draggedIndex.value = index;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", index);
};
const handleDragOver = (event, index) => {
  event.preventDefault();
  if (index !== draggedIndex.value) {
    dragOverIndex.value = index;
  }
};
const handleDragLeave = () => {
  dragOverIndex.value = null;
};
const handleDrop = (event) => {
  event.preventDefault();
  const startIndex = parseInt(event.dataTransfer.getData("text/plain"), 10);
  const targetIndex = dragOverIndex.value;
  if (targetIndex !== null && startIndex !== targetIndex) {
    const prompts = activePreset.value.prompts;
    const [draggedItem] = prompts.splice(startIndex, 1);
    prompts.splice(targetIndex, 0, draggedItem);
  }
  handleDragEnd();
};
const handleDragEnd = () => {
  draggedIndex.value = null;
  dragOverIndex.value = null;
};
</script>

<style scoped>
/* (关键新增) 开关 (Switch) 的样式 */
.switch-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
}
.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
}
input:checked + .slider {
  background-color: #2196f3;
}
input:focus + .slider {
  box-shadow: 0 0 1px #2196f3;
}
input:checked + .slider:before {
  transform: translateX(22px);
}
.slider.round {
  border-radius: 34px;
}
.slider.round:before {
  border-radius: 50%;
}

/* 其他样式保持不变，只微调 */
.param-grid {
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
} /* 稍微加宽以容纳中文 */
.sidebar {
  width: 260px;
} /* 稍微加宽 */
th {
  font-size: 0.8em;
} /* 缩小表头字体以容纳更多列 */
.page-layout {
  display: flex;
  height: 100%;
}
.sidebar {
  flex-shrink: 0;
  background-color: #e9ecef;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #dee2e6;
}
.sidebar h3 {
  margin-top: 0;
}
.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
  flex-grow: 1;
}
.sidebar li {
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sidebar li:hover {
  background-color: #dee2e6;
}
.sidebar li.active {
  background-color: #007bff;
  color: white;
}
.sidebar-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.sidebar-actions button {
  width: 100%;
}
.editor-content {
  flex-grow: 1;
  padding: 2rem;
  overflow-y: auto;
  background: #fff;
}
.editor-header {
  margin-bottom: 2rem;
}
.preset-name-input {
  font-size: 1.8rem;
  font-weight: bold;
  border: none;
  border-bottom: 2px solid #ccc;
  width: 100%;
  padding: 0.5rem 0;
}
.editor-section {
  margin-bottom: 2.5rem;
}
.editor-section h4 {
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
}
.form-group label {
  font-weight: bold;
  color: #555;
}
.form-group input[type="number"] {
  font-size: 1rem;
}
.prompts-table-wrapper {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #ccc;
  border-radius: 4px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 0.75rem;
  border: 1px solid #ddd;
  text-align: left;
  vertical-align: top;
}
th {
  background-color: #f8f9fa;
  position: sticky;
  top: 0;
  z-index: 1;
}
.table-input,
.table-textarea,
.table-select {
  width: 100%;
  border: 1px solid #eee;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.9em;
}
.table-input-small {
  width: 60px;
}
.table-textarea {
  min-height: 80px;
  resize: vertical;
}
.content-col {
  width: 45%;
}
.delete-btn {
  background: none;
  border: none;
  color: #dc3545;
  font-size: 1.2rem;
  cursor: pointer;
  display: none;
}
li:hover .delete-btn,
li.active .delete-btn {
  display: block;
}
.delete-btn-small {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
.add-prompt-btn {
  margin-top: 1rem;
}
button {
  padding: 0.5rem 1rem;
  border: none;
  background-color: #007bff;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background-color: #0056b3;
}
.draggable-row {
  cursor: grab;
  user-select: none;
}
.draggable-row:active {
  cursor: grabbing;
}
.drag-over-highlight {
  border-top: 2px solid #007bff;
}
.divider-row td {
  padding: 0;
  border-left: none;
  border-right: none;
}
.divider-content {
  text-align: center;
  color: #888;
  padding: 0.5rem;
  background-color: #f8f9fa;
  font-weight: bold;
}
.prompt-type-exclusive {
  background-color: rgba(40, 167, 69, 0.1);
}
.prompt-type-jailbreak {
  background-color: rgba(220, 53, 69, 0.1);
}
.prompt-type-optional {
  background-color: rgba(255, 193, 7, 0.1);
}
.prompt-type-semifixed {
  background-color: rgba(0, 123, 255, 0.1);
}
</style>
