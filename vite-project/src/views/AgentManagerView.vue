<template>
  <div class="page-layout">
    <!-- 左侧边栏：角色/智能体列表和管理 -->
    <aside class="sidebar">
      <h3>智能体列表</h3>
      <ul>
        <li
          v-for="agent in store.agentList"
          :key="agent.id"
          :class="{ active: store.activeAgentId === agent.id }"
          @click="handleAgentSwitch(agent.id)"
        >
          <input
            v-if="editingAgentId === agent.id"
            v-model="editingAgentName"
            @blur="saveAgentName(agent)"
            @keyup.enter="saveAgentName(agent)"
            class="char-name-input"
            ref="agentNameInputRef"
          />
          <span v-else @dblclick="startEditingAgentName(agent)">{{
            agent.name
          }}</span>

          <button @click.stop="handleDelete(agent.id)" class="delete-btn">
            ×
          </button>
        </li>
      </ul>
      <div class="sidebar-actions">
        <button @click="store.addNewAgent">新建智能体</button>
        <button @click="triggerImport">导入角色卡 (.json/.png)</button>
        <input
          type="file"
          ref="fileInput"
          @change="handleFileUpload"
          accept=".json,.png"
          style="display: none"
        />
      </div>
    </aside>

    <!-- 右侧主内容区：世界书/知识库编辑器 -->
    <main class="editor-content" v-if="activeAgent">
      <section class="editor-section">
        <div class="tabs">
          <button
            :class="{ active: activeTab === 'local' }"
            @click="activeTab = 'local'"
          >
            角色知识库 ({{ localLorebookEntries.length }})
          </button>
          <button
            :class="{ active: activeTab === 'global' }"
            @click="activeTab = 'global'"
          >
            全局知识库 ({{ store.globalLorebookEntries.length }})
          </button>
        </div>

        <div class="table-container">
          <div class="prompts-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>启用</th>
                  <th class="comment-col">注释</th>
                  <th class="keys-col">关键词 (数组格式)</th>
                  <th class="content-col">内容</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody @drop="handleDrop" @dragover.prevent>
                <tr
                  v-for="entry in activeEntries"
                  :key="entry.uid"
                  :draggable="true"
                  @dragstart="handleDragStart($event, entry)"
                  @dragover="handleDragOver($event, entry)"
                  @dragleave="handleDragLeave"
                  @dragend="handleDragEnd"
                  :class="{
                    'drag-over-highlight':
                      dragOverEntry && dragOverEntry.uid === entry.uid,
                  }"
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
                      @click="store.deleteLorebookEntry(entry.uid)"
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
            {{ activeTab === "local" ? "添加角色知识" : "添加全局知识" }}
          </button>
        </div>
      </section>
    </main>

    <div v-else class="editor-content-placeholder">
      <p>请在左侧选择或创建一个智能体。</p>
    </div>

    <!-- 导入预览模态框 (保持不变) -->
    <div v-if="isModalVisible" class="modal-overlay" @click.self="cancelImport">
      <div class="modal-content">
        <h3>角色卡数据预览</h3>
        <p>请确认以下 JSON 数据是否正确，确认后将创建新角色。</p>
        <pre class="json-preview">{{ formattedCardData }}</pre>
        <div class="modal-actions">
          <button @click="cancelImport" class="btn-secondary">取消</button>
          <button @click="confirmImport" class="btn-primary">确认导入</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from "vue";
import { useAgentStore } from "@/stores/agentStore";
import extract from "png-chunks-extract";

const store = useAgentStore();
const fileInput = ref(null);
const activeTab = ref("local");
const draggedEntry = ref(null);
const dragOverEntry = ref(null);
const editingAgentId = ref(null);
const editingAgentName = ref("");
const agentNameInputRef = ref(null);
const isModalVisible = ref(false);
const parsedCardData = ref("");

const activeAgent = computed(() => store.activeAgent);
const localLorebookEntries = computed(() =>
  activeAgent.value
    ? store.getLorebookEntriesForAgent(activeAgent.value.id)
    : []
);
const activeEntries = computed(() =>
  activeTab.value === "local"
    ? localLorebookEntries.value
    : store.globalLorebookEntries
);
const formattedCardData = computed(() => {
  try {
    return JSON.stringify(JSON.parse(parsedCardData.value), null, 2);
  } catch {
    return "无效的 JSON 数据";
  }
});

const handleAgentSwitch = (id) => {
  editingAgentId.value = null;
  store.activeAgentId = id;
};

const startEditingAgentName = (agent) => {
  editingAgentId.value = agent.id;
  editingAgentName.value = agent.name;
  nextTick(() => {
    agentNameInputRef.value?.focus();
  });
};

const saveAgentName = (agent) => {
  if (editingAgentName.value.trim()) {
    agent.name = editingAgentName.value.trim();
  }
  editingAgentId.value = null;
};

const addActiveEntry = () => {
  const agentId = activeTab.value === "local" ? activeAgent.value.id : null;
  store.addLorebookEntry(agentId);
};

const handleDelete = (id) => {
  if (confirm(`确认删除智能体? 这也会删除其专属的知识库条目。`)) {
    store.deleteAgent(id);
  }
};

const triggerImport = () => {
  fileInput.value.click();
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const processJsonString = (jsonString) => {
    parsedCardData.value = jsonString;
    isModalVisible.value = true;
  };

  if (file.type === "application/json" || file.name.endsWith(".json")) {
    const reader = new FileReader();
    reader.onload = (e) => processJsonString(e.target.result);
    reader.readAsText(file);
  } else if (file.type === "image/png") {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const chunks = extract(new Uint8Array(e.target.result));
        const textChunk = chunks.find((chunk) => chunk.name === "tEXt");
        if (
          textChunk &&
          new TextDecoder("latin1").decode(textChunk.data).startsWith("chara")
        ) {
          const base64String = new TextDecoder("latin1")
            .decode(textChunk.data)
            .replace("chara\x00", "");
          const binaryString = atob(base64String);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const finalJsonString = new TextDecoder("utf-8").decode(bytes);
          processJsonString(finalJsonString);
        } else {
          alert("图片中未找到有效的 SillyTavern 角色数据！");
        }
      } catch (e) {
        alert(`解析图片角色卡失败: ${e.message}`);
        console.error(e);
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert("不支持的文件类型！请选择 .json 或 .png 文件。");
  }

  event.target.value = "";
};

const confirmImport = () => {
  store.importCharacterCard(parsedCardData.value);
  isModalVisible.value = false;
  parsedCardData.value = "";
};

const cancelImport = () => {
  isModalVisible.value = false;
  parsedCardData.value = "";
};

// --- 拖拽排序逻辑 ---
const handleDragStart = (event, entry) => {
  draggedEntry.value = entry;
  event.dataTransfer.effectAllowed = "move";
};
const handleDragOver = (event, entry) => {
  event.preventDefault();
  if (entry.uid !== draggedEntry.value?.uid) {
    dragOverEntry.value = entry;
  }
};
const handleDragLeave = () => {
  dragOverEntry.value = null;
};
const handleDrop = (event) => {
  event.preventDefault();
  if (!draggedEntry.value || !dragOverEntry.value) {
    handleDragEnd();
    return;
  }
  const targetUid = dragOverEntry.value.uid;
  if (draggedEntry.value.uid === targetUid) return;
  const allEntries = [...store.lorebookEntries];
  const draggedIndex = allEntries.findIndex(
    (e) => e.uid === draggedEntry.value.uid
  );
  let targetIndex = allEntries.findIndex((e) => e.uid === targetUid);
  if (draggedIndex > -1 && targetIndex > -1) {
    const [item] = allEntries.splice(draggedIndex, 1);
    allEntries.splice(targetIndex, 0, item);
    store.updateLorebookEntriesOrder(allEntries);
  }
  handleDragEnd();
};
const handleDragEnd = () => {
  draggedEntry.value = null;
  dragOverEntry.value = null;
};
</script>

<style scoped>
/* 样式保持不变 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}
.json-preview {
  background-color: #f4f4f4;
  border: 1px solid #ccc;
  padding: 1rem;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  flex-grow: 1;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}
.btn-primary {
  background-color: #007bff;
  color: white;
}
.btn-secondary {
  background-color: #6c757d;
  color: white;
}
.page-layout {
  display: flex;
  height: 100%;
}
.sidebar {
  width: 260px;
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
  overflow-y: auto;
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
.sidebar li span {
  flex-grow: 1;
  padding: 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.char-name-input {
  width: 100%;
  box-sizing: border-box;
}
.sidebar-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 1rem;
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
.editor-content-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #888;
  font-size: 1.2rem;
  flex-grow: 1;
}
.editor-section {
  margin-bottom: 3rem;
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
.draggable-row {
  cursor: grab;
}
.drag-over-highlight {
  border-top: 2px solid #007bff;
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
