<template>
  <div class="page-layout">
    <main class="editor-content">
      <div class="editor-header">
        <h2>世界书</h2>
        <div class="header-actions">
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

      <!-- (关键新增) 标签页切换 -->
      <div class="tabs">
        <button
          :class="{ active: activeTab === 'local' }"
          @click="activeTab = 'local'"
        >
          局部世界书 ({{ store.localEntries.length }})
        </button>
        <button
          :class="{ active: activeTab === 'global' }"
          @click="activeTab = 'global'"
        >
          全局世界书 ({{ store.globalEntries.length }})
        </button>
      </div>

      <!-- (关键修改) 功能强大的可编辑表格 -->
      <div class="table-container">
        <div class="prompts-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>启用</th>
                <th class="comment-col">注释</th>
                <th class="keys-col">关键词 (逗号分隔)</th>
                <th class="content-col">内容</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody @drop="handleDrop" @dragover.prevent @dragenter.prevent>
              <tr
                v-for="(entry, index) in activeEntries"
                :key="entry.uid"
                :draggable="true"
                @dragstart="handleDragStart($event, entry)"
                class="draggable-row"
              >
                <td><input type="checkbox" v-model="entry.enabled" /></td>
                <td class="comment-col">
                  <input
                    type="text"
                    v-model="entry.comment"
                    class="table-input"
                  />
                </td>
                <td class="keys-col">
                  <textarea
                    v-model="entry.keys"
                    class="table-textarea-small"
                  ></textarea>
                </td>
                <td class="content-col">
                  <textarea
                    v-model="entry.content"
                    class="table-textarea"
                  ></textarea>
                </td>
                <td>
                  <button
                    @click="store.deleteEntry(entry.uid)"
                    class="delete-btn-small"
                  >
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <button @click="addActiveEntry" class="add-entry-btn">
          {{ activeTab === "local" ? "添加局部条目" : "添加全局条目" }}
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useWorldbookStore } from "@/stores/worldbookStore";

const store = useWorldbookStore();
const fileInput = ref(null);
const activeTab = ref("local"); // 默认显示局部世界书

// (关键新增) 拖拽状态
const draggedEntry = ref(null);

// 计算属性，根据当前激活的标签页返回对应的条目列表
const activeEntries = computed(() => {
  return activeTab.value === "local" ? store.localEntries : store.globalEntries;
});

const addActiveEntry = () => {
  store.addEntry(activeTab.value === "global");
};

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

// --- (关键新增) 拖拽排序逻辑 ---
const handleDragStart = (event, entry) => {
  draggedEntry.value = entry;
  event.dataTransfer.effectAllowed = "move";
};

const handleDrop = (event) => {
  event.preventDefault();
  const targetElement = event.target.closest("tr");
  if (!targetElement || !draggedEntry.value) return;

  const targetUid = targetElement.__vueParentComponent.props.entry.uid;
  if (draggedEntry.value.uid === targetUid) return;

  const allEntries = [...store.entries];
  const draggedIndex = allEntries.findIndex(
    (e) => e.uid === draggedEntry.value.uid
  );
  const targetIndex = allEntries.findIndex((e) => e.uid === targetUid);

  if (draggedIndex > -1 && targetIndex > -1) {
    const [item] = allEntries.splice(draggedIndex, 1);
    allEntries.splice(targetIndex, 0, item);
    store.updateEntriesOrder(allEntries); // 调用 store action 来更新顺序
  }

  draggedEntry.value = null;
};
</script>

<style scoped>
.page-layout {
  display: flex;
  height: 100%;
}
.editor-content {
  flex-grow: 1;
  padding: 2rem;
  overflow-y: auto;
  background: #fff;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.header-actions {
  display: flex;
  gap: 1rem;
}

/* (关键新增) 标签页样式 */
.tabs {
  display: flex;
  border-bottom: 2px solid #dee2e6;
  margin-bottom: 1.5rem;
}
.tabs button {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1.1rem;
  color: #6c757d;
  position: relative;
  bottom: -2px;
}
.tabs button.active {
  color: #007bff;
  border: 2px solid #dee2e6;
  border-bottom: 2px solid #fff;
  border-radius: 4px 4px 0 0;
}

.table-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
.prompts-table-wrapper {
  border: 1px solid #ccc;
  border-radius: 4px;
  flex-grow: 1;
  overflow-y: auto;
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
.table-textarea-small {
  width: 100%;
  border: 1px solid #eee;
  padding: 0.5rem;
  border-radius: 4px;
  box-sizing: border-box;
}
.table-textarea {
  min-height: 80px;
  resize: vertical;
}
.table-textarea-small {
  min-height: 40px;
  resize: vertical;
}
.comment-col {
  width: 20%;
}
.keys-col {
  width: 25%;
}
.content-col {
  width: 45%;
}
.delete-btn-small {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
.add-entry-btn {
  margin-top: 1rem;
  align-self: flex-start;
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
}
</style>
