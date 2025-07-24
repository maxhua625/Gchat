<template>
  <div class="page-layout">
    <main class="editor-content" style="max-width: 1200px; margin: 0 auto">
      <div class="editor-header">
        <h2>世界书</h2>
        <div class="header-actions">
          <button @click="store.addEntry">添加条目</button>
          <button @click="triggerImport">导入 (.json)</button>
          <button @click="store.exportWorldbook">导出 (.json)</button>
          <input
            type="file"
            ref="fileInput"
            @change="handleFileUpload"
            accept=".json"
            style="display: none"
          />
        </div>
      </div>

      <div class="prompts-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>启用</th>
              <th class="keys-col">关键词 (逗号分隔)</th>
              <th class="content-col">内容</th>
              <th>全局</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(entry, index) in store.entries" :key="index">
              <td><input type="checkbox" v-model="entry.enabled" /></td>
              <td class="keys-col">
                <input type="text" v-model="entry.keys" class="table-input" />
              </td>
              <td class="content-col">
                <textarea
                  v-model="entry.content"
                  class="table-textarea"
                ></textarea>
              </td>
              <td><input type="checkbox" v-model="entry.isGlobal" /></td>
              <td>
                <button
                  @click="store.deleteEntry(index)"
                  class="delete-btn-small"
                >
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useWorldbookStore } from "@/stores/worldbookStore";

const store = useWorldbookStore();
const fileInput = ref(null);

const triggerImport = () => {
  fileInput.value.click();
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    store.importWorldbook(e.target.result);
    event.target.value = "";
  };
  reader.readAsText(file);
};
</script>

<style scoped>
/* Reusing styles from PresetsView for consistency */
.page-layout {
  display: flex;
  height: 100%;
}
.editor-content {
  flex-grow: 1;
  padding: 2rem;
  overflow-y: auto;
  background: #fff;
}
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.header-actions {
  display: flex;
  gap: 1rem;
}
.prompts-table-wrapper {
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
}
.table-input,
.table-textarea {
  width: 100%;
  border: 1px solid #eee;
  padding: 0.5rem;
  border-radius: 4px;
}
.table-textarea {
  min-height: 80px;
  resize: vertical;
}
.keys-col {
  width: 25%;
}
.content-col {
  width: 50%;
}
.delete-btn-small {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
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
