<template>
  <div class="page-layout">
    <aside class="sidebar">
      <h3>角色列表</h3>
      <ul>
        <li
          v-for="char in characterStore.characterList"
          :key="char.id"
          :class="{ active: characterStore.activeCharacterId === char.id }"
          @click="characterStore.activeCharacterId = char.id"
        >
          {{ char.name }}
          <button @click.stop="handleDelete(char.id)" class="delete-btn">
            ×
          </button>
        </li>
      </ul>
      <div class="sidebar-actions">
        <button @click="characterStore.addNewCharacter">新建角色</button>
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

    <main class="editor-content" v-if="activeCharacter">
      <!-- 区域一：角色属性编辑器 -->
      <section class="editor-section">
        <div class="editor-header">
          <input
            type="text"
            v-model="activeCharacter.name"
            class="preset-name-input"
          />
        </div>
        <div class="param-grid">
          <div class="form-group span-2">
            <label for="description">角色描述 (Description)</label>
            <textarea
              id="description"
              v-model="activeCharacter.description"
            ></textarea>
          </div>
          <div class="form-group span-2">
            <label for="personality">性格 (Personality)</label>
            <textarea
              id="personality"
              v-model="activeCharacter.personality"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="scenario">场景 (Scenario)</label>
            <textarea
              id="scenario"
              v-model="activeCharacter.scenario"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="first_mes">问候语 (First Message)</label>
            <textarea
              id="first_mes"
              v-model="activeCharacter.first_mes"
            ></textarea>
          </div>
          <div class="form-group span-2">
            <label for="mes_example">对话示例 (Message Example)</label>
            <textarea
              id="mes_example"
              v-model="activeCharacter.mes_example"
            ></textarea>
          </div>
        </div>
      </section>

      <!-- 区域二：世界书编辑器 -->
      <section class="editor-section">
        <div class="tabs">
          <button
            :class="{ active: activeTab === 'local' }"
            @click="activeTab = 'local'"
          >
            角色世界书 ({{ localEntries.length }})
          </button>
          <button
            :class="{ active: activeTab === 'global' }"
            @click="activeTab = 'global'"
          >
            全局世界书 ({{ worldbookStore.globalEntries.length }})
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
              <tbody @drop="handleDrop" @dragover.prevent @dragenter.prevent>
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
                      @click="worldbookStore.deleteEntry(entry.uid)"
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
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useCharacterStore } from "@/stores/characterStore";
import { useWorldbookStore } from "@/stores/worldbookStore";
import extract from "png-chunks-extract";

const characterStore = useCharacterStore();
const worldbookStore = useWorldbookStore();
const fileInput = ref(null);
const activeTab = ref("local");
const draggedEntry = ref(null);
const dragOverEntry = ref(null);

const activeCharacter = computed(() => characterStore.activeCharacter);

const localEntries = computed(() => {
  if (!activeCharacter.value) return [];
  return worldbookStore.getEntriesForCharacter(activeCharacter.value.id);
});
const activeEntries = computed(() => {
  return activeTab.value === "local"
    ? localEntries.value
    : worldbookStore.globalEntries;
});

const addActiveEntry = () => {
  const charId = activeTab.value === "local" ? activeCharacter.value.id : null;
  worldbookStore.addEntry(charId);
};

const handleDelete = (id) => {
  if (
    confirm(
      `确认删除角色 "${
        characterStore.characterList.find((c) => c.id === id).name
      }"? 这也会删除其专属的世界书条目。`
    )
  ) {
    characterStore.deleteCharacter(id);
  }
};
const triggerImport = () => {
  fileInput.value.click();
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.type === "application/json" || file.name.endsWith(".json")) {
    const reader = new FileReader();
    reader.onload = (e) => characterStore.importCharacterCard(e.target.result);
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
          characterStore.importCharacterCard(finalJsonString);
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
  event.dataTransfer.setData("application/json", JSON.stringify(entry));
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

  const allEntries = [...worldbookStore.entries];
  const draggedIndex = allEntries.findIndex(
    (e) => e.uid === draggedEntry.value.uid
  );
  let targetIndex = allEntries.findIndex((e) => e.uid === targetUid);

  if (draggedIndex > -1 && targetIndex > -1) {
    // 经典数组排序算法
    const [item] = allEntries.splice(draggedIndex, 1);
    allEntries.splice(targetIndex, 0, item);
    worldbookStore.updateEntriesOrder(allEntries);
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
.editor-section {
  margin-bottom: 3rem;
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
.param-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}
.form-group {
  display: flex;
  flex-direction: column;
}
.form-group.span-2 {
  grid-column: span 2;
}
.form-group label {
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #555;
}
.form-group textarea {
  width: 100%;
  min-height: 120px;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 1rem;
  resize: vertical;
  box-sizing: border-box;
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
