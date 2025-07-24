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

      <section class="editor-section">
        <h4>模型参数</h4>
        <div class="param-grid">
          <div class="form-group" v-for="param in modelParams" :key="param.key">
            <label :for="param.key" :title="param.description">{{
              param.label
            }}</label>
            <input
              :id="param.key"
              type="number"
              v-model.number="activePreset[param.key]"
              :step="param.step"
            />
          </div>
        </div>
      </section>

      <section class="editor-section">
        <h4>提示词注入 (Prompts)</h4>
        <div class="prompts-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>启用</th>
                <th>名称</th>
                <th>角色</th>
                <th class="content-col">内容</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(prompt, index) in activePreset.prompts" :key="index">
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
                  <button @click="deletePrompt(index)" class="delete-btn-small">
                    删除
                  </button>
                </td>
              </tr>
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

const modelParams = ref([
  {
    key: "temperature",
    label: "Temperature",
    description: "随机性，值越高越随机",
    step: 0.01,
  },
  {
    key: "top_p",
    label: "Top P",
    description: "核心采样，保留概率最高的词汇",
    step: 0.01,
  },
  { key: "top_k", label: "Top K", description: "保留 K 个最可能的词", step: 1 },
  {
    key: "repetition_penalty",
    label: "Repetition Penalty",
    description: "重复惩罚，值越高越不易重复",
    step: 0.01,
  },
  {
    key: "frequency_penalty",
    label: "Frequency Penalty",
    description: "频率惩罚",
    step: 0.01,
  },
  {
    key: "presence_penalty",
    label: "Presence Penalty",
    description: "存在惩罚",
    step: 0.01,
  },
]);

const activePreset = computed(() => store.activePreset);

const addPrompt = () => {
  if (!activePreset.value.prompts) {
    activePreset.value.prompts = [];
  }
  activePreset.value.prompts.push({
    name: "新提示词",
    role: "system",
    content: "",
    enabled: true,
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
</script>

<style scoped>
/* Scoped styles from your previous request, with generic names */
.page-layout {
  display: flex;
  height: 100%;
}
.sidebar {
  width: 240px;
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

.param-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}
.form-group label {
  font-weight: normal;
  color: #555;
}
.form-group input[type="number"] {
  font-size: 1rem;
}

.prompts-table-wrapper {
  max-height: 400px;
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
}
.table-input,
.table-textarea,
.table-select {
  width: 100%;
  border: 1px solid #eee;
  padding: 0.5rem;
  border-radius: 4px;
}
.table-textarea {
  min-height: 80px;
  resize: vertical;
}
.content-col {
  width: 50%;
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
</style>
