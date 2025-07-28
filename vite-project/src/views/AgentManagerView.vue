<template>
  <div class="page-layout">
    <!-- 左侧边栏：智能体列表和管理 -->
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

    <!-- 右侧主内容区：世界书管理器 -->
    <main class="editor-content" v-if="activeAgent">
      <section class="editor-section">
        <div class="tabs">
          <button
            :class="{ active: activeTab === 'local' }"
            @click="activeTab = 'local'"
          >
            {{ activeAgent.name }} 的世界书 ({{ localWorldbookEntries.length }})
          </button>
          <button
            :class="{ active: activeTab === 'global' }"
            @click="activeTab = 'global'"
          >
            全局世界书 ({{ store.globalWorldbookEntries.length }})
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
                      @click="store.deleteWorldbookEntry(entry.uid)"
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
            {{ activeTab === "local" ? "添加角色条目" : "添加全局条目" }}
          </button>
        </div>
      </section>
    </main>

    <!-- 如果没有选中任何智能体，显示占位提示 -->
    <div v-else class="editor-content-placeholder">
      <p>请在左侧选择或创建一个智能体。</p>
    </div>
  </div>
  <!-- (关键修复) 补全了这个缺失的闭合标签 -->
</template>

<script setup>
import { ref, computed, nextTick } from "vue";
import { useAgentStore } from "@/stores/agentStore";
import extract from "png-chunks-extract";

// --- Store 初始化 ---
const store = useAgentStore();

// --- 响应式状态 ---
const fileInput = ref(null);
const activeTab = ref("local"); // 'local' 或 'global'
const draggedEntry = ref(null);
const dragOverEntry = ref(null);
const editingAgentId = ref(null);
const editingAgentName = ref("");
const agentNameInputRef = ref(null);

// --- 计算属性 ---
const activeAgent = computed(() => store.activeAgent);

// 根据激活的智能体，获取其专属的世界书条目
const localWorldbookEntries = computed(() =>
  activeAgent.value
    ? store.getLocalWorldbookEntries(activeAgent.value.id).value
    : []
);

// 根据当前激活的标签页，决定表格显示哪个列表
const activeEntries = computed(() =>
  activeTab.value === "local"
    ? localWorldbookEntries.value
    : store.globalWorldbookEntries
);

// --- 方法 ---

// 切换智能体
const handleAgentSwitch = (id) => {
  editingAgentId.value = null; // 切换时总是退出编辑模式
  store.activeAgentId = id;
};

// 开始编辑智能体名称
const startEditingAgentName = (agent) => {
  editingAgentId.value = agent.id;
  editingAgentName.value = agent.name;
  nextTick(() => {
    agentNameInputRef.value?.focus();
  });
};

// 保存智能体名称
const saveAgentName = (agent) => {
  if (editingAgentName.value.trim()) {
    agent.name = editingAgentName.value.trim();
  }
  editingAgentId.value = null; // 退出编辑模式
};

// 添加新的世界书条目
const addActiveEntry = () => {
  const agentId = activeTab.value === "local" ? activeAgent.value.id : null;
  store.addWorldbookEntry(agentId);
};

// 删除智能体（联动删除世界书）
const handleDelete = (id) => {
  if (confirm(`确认删除该智能体? 这也会删除其专属的世界书条目。`)) {
    store.deleteAgent(id);
  }
};

// 触发文件选择框
const triggerImport = () => {
  fileInput.value.click();
};

// 处理文件上传
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.type === "application/json" || file.name.endsWith(".json")) {
    const reader = new FileReader();
    reader.onload = (e) => store.importCharacterCard(e.target.result);
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
          store.importCharacterCard(finalJsonString);
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

  const allEntries = [...store.worldbookEntries];
  const draggedIndex = allEntries.findIndex(
    (e) => e.uid === draggedEntry.value.uid
  );
  let targetIndex = allEntries.findIndex((e) => e.uid === targetUid);

  if (draggedIndex > -1 && targetIndex > -1) {
    const [item] = allEntries.splice(draggedIndex, 1);
    allEntries.splice(targetIndex, 0, item);
    store.updateWorldbookOrder(allEntries);
  }

  handleDragEnd();
};

const handleDragEnd = () => {
  draggedEntry.value = null;
  dragOverEntry.value = null;
};
</script>

<style scoped>
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
