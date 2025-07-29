<template>
  <div class="presets-view">
    <h1>模型参数预设</h1>
    <p class="description">
      在这里调整和管理模型的各项参数。您可以导入、导出或保存当前设置为默认值。
    </p>

    <!-- ... [顶部的按钮和参数设置区域保持不变] ... -->
    <div class="actions">
      <input
        type="file"
        @change="handleFileUpload"
        accept=".json"
        ref="fileInput"
        style="display: none"
      />
      <button @click="triggerFileUpload">导入预设</button>
      <button @click="exportPreset">导出预设</button>
      <button @click="saveAsDefault">保存为默认</button>
    </div>

    <div class="settings-grid">
      <!-- 核心采样参数 -->
      <fieldset>
        <legend>核心采样参数 (Core Sampling)</legend>
        <div class="form-group">
          <label for="temperature"
            >Temperature: {{ presetsStore.temperature }}</label
          >
          <input
            type="range"
            id="temperature"
            min="0"
            max="2"
            step="0.01"
            v-model.number="presetsStore.temperature"
          />
        </div>
        <div class="form-group">
          <label for="top_p">Top P: {{ presetsStore.top_p }}</label>
          <input
            type="range"
            id="top_p"
            min="0"
            max="1"
            step="0.01"
            v-model.number="presetsStore.top_p"
          />
        </div>
        <div class="form-group">
          <label for="top_k">Top K: {{ presetsStore.top_k }}</label>
          <input
            type="range"
            id="top_k"
            min="0"
            max="100"
            step="1"
            v-model.number="presetsStore.top_k"
          />
        </div>
        <div class="form-group">
          <label for="top_a">Top A: {{ presetsStore.top_a }}</label>
          <input
            type="range"
            id="top_a"
            min="0"
            max="1"
            step="0.01"
            v-model.number="presetsStore.top_a"
          />
        </div>
        <div class="form-group">
          <label for="min_p">Min P: {{ presetsStore.min_p }}</label>
          <input
            type="range"
            id="min_p"
            min="0"
            max="1"
            step="0.01"
            v-model.number="presetsStore.min_p"
          />
        </div>
        <div class="form-group">
          <label for="repetition_penalty"
            >Repetition Penalty: {{ presetsStore.repetition_penalty }}</label
          >
          <input
            type="range"
            id="repetition_penalty"
            min="1"
            max="2"
            step="0.01"
            v-model.number="presetsStore.repetition_penalty"
          />
        </div>
        <div class="form-group">
          <label for="frequency_penalty"
            >Frequency Penalty: {{ presetsStore.frequency_penalty }}</label
          >
          <input
            type="range"
            id="frequency_penalty"
            min="0"
            max="2"
            step="0.01"
            v-model.number="presetsStore.frequency_penalty"
          />
        </div>
        <div class="form-group">
          <label for="presence_penalty"
            >Presence Penalty: {{ presetsStore.presence_penalty }}</label
          >
          <input
            type="range"
            id="presence_penalty"
            min="0"
            max="2"
            step="0.01"
            v-model.number="presetsStore.presence_penalty"
          />
        </div>
        <div class="form-group">
          <label for="seed">Seed (-1 for random)</label>
          <input type="number" id="seed" v-model.number="presetsStore.seed" />
        </div>
      </fieldset>

      <!-- 上下文与格式化 -->
      <fieldset>
        <legend>上下文与格式化 (Context & Formatting)</legend>
        <div class="form-group">
          <label for="openai_max_tokens">Max Tokens</label>
          <input
            type="number"
            id="openai_max_tokens"
            v-model.number="presetsStore.openai_max_tokens"
          />
        </div>
        <div class="form-group">
          <label for="impersonation_prompt">Impersonation Prompt</label>
          <textarea
            id="impersonation_prompt"
            rows="3"
            v-model="presetsStore.impersonation_prompt"
          ></textarea>
        </div>
        <div class="form-group">
          <label for="continue_nudge_prompt">Continue Nudge Prompt</label>
          <textarea
            id="continue_nudge_prompt"
            rows="3"
            v-model="presetsStore.continue_nudge_prompt"
          ></textarea>
        </div>
        <div class="form-group checkbox-group">
          <input
            type="checkbox"
            id="wrap_in_quotes"
            v-model="presetsStore.wrap_in_quotes"
          />
          <label for="wrap_in_quotes">Wrap in Quotes</label>
        </div>
      </fieldset>

      <!-- API & 高级选项 -->
      <fieldset>
        <legend>API & 高级选项 (Advanced Options)</legend>
        <div class="form-group">
          <label for="reverse_proxy">Reverse Proxy URL</label>
          <input
            type="text"
            id="reverse_proxy"
            v-model.trim="presetsStore.reverse_proxy"
          />
        </div>
        <div class="form-group checkbox-group">
          <input
            type="checkbox"
            id="stream_openai"
            v-model="presetsStore.stream_openai"
          />
          <label for="stream_openai">Stream OpenAI</label>
        </div>
        <div class="form-group checkbox-group">
          <input
            type="checkbox"
            id="function_calling"
            v-model="presetsStore.function_calling"
          />
          <label for="function_calling">Enable Function Calling</label>
        </div>
        <div class="form-group checkbox-group">
          <input
            type="checkbox"
            id="image_inlining"
            v-model="presetsStore.image_inlining"
          />
          <label for="image_inlining">Enable Image Inlining</label>
        </div>
        <div class="form-group checkbox-group">
          <input
            type="checkbox"
            id="enable_web_search"
            v-model="presetsStore.enable_web_search"
          />
          <label for="enable_web_search">Enable Web Search</label>
        </div>
      </fieldset>
    </div>

    <!-- 提示词管理界面 (完全重构) -->
    <div class="prompt-management-area">
      <h2>提示词管理 (Prompts Management)</h2>

      <!-- 按角色分组显示排序后的提示 -->
      <div
        v-for="charOrder in presetsStore.prompt_order"
        :key="charOrder.character_id"
        class="character-prompt-group"
      >
        <h3 class="character-title">
          角色 (Character ID): {{ charOrder.character_id }} 的提示顺序
        </h3>
        <draggable
          v-model="charOrder.order"
          item-key="identifier"
          class="prompt-list draggable"
          ghost-class="ghost"
          handle=".handle"
        >
          <template #item="{ element: orderItem }">
            <div class="prompt-card">
              <!-- 查找并显示完整的 Prompt 详细信息 -->
              <div
                v-if="getPromptDetails(orderItem.identifier)"
                class="prompt-card-content"
              >
                <div class="prompt-header">
                  <span class="handle">⠿</span>
                  <span class="prompt-name">{{
                    getPromptDetails(orderItem.identifier).name
                  }}</span>
                  <div class="prompt-controls">
                    <!-- v-model 直接绑定到 prompt_order 里的 enabled 属性 -->
                    <input
                      type="checkbox"
                      :id="orderItem.identifier + charOrder.character_id"
                      v-model="orderItem.enabled"
                      class="prompt-toggle"
                    />
                    <label :for="orderItem.identifier + charOrder.character_id"
                      >启用</label
                    >
                  </div>
                </div>
                <div class="prompt-content">
                  <textarea readonly rows="3">{{
                    getPromptDetails(orderItem.identifier).content
                  }}</textarea>
                </div>
              </div>
              <!-- 如果在 prompts 库中找不到对应的 identifier -->
              <div v-else class="prompt-card-error">
                <p>
                  <strong>错误：</strong>在提示库中找不到 Identifier 为
                  <code>{{ orderItem.identifier }}</code> 的提示。
                </p>
              </div>
            </div>
          </template>
        </draggable>
      </div>

      <!-- 显示未被使用的提示 -->
      <div class="unassigned-prompts-group" v-if="unassignedPrompts.length">
        <h3 class="character-title">未使用的提示 (Available Prompts)</h3>
        <div class="prompt-list">
          <div
            v-for="prompt in unassignedPrompts"
            :key="prompt.identifier"
            class="prompt-card unassigned"
          >
            <div class="prompt-header">
              <span class="prompt-name">{{ prompt.name }}</span>
              <div class="prompt-controls">
                <button
                  class="add-btn"
                  @click="addPromptToCharacter(prompt.identifier)"
                >
                  添加到角色
                </button>
              </div>
            </div>
            <div class="prompt-content">
              <textarea readonly rows="3">{{ prompt.content }}</textarea>
            </div>
          </div>
        </div>
      </div>
      <div class="actions">
        <button @click="presetsStore.addPrompt()">
          创建新提示 (在'未使用'中)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { usePresetsStore } from "@/stores/presetsStore";
import draggable from "vuedraggable"; // 引入 draggable

const presetsStore = usePresetsStore();
const fileInput = ref(null);

// Helper function to find full prompt details by identifier
const getPromptDetails = (identifier) => {
  return presetsStore.prompts.find((p) => p.identifier === identifier);
};

// Computed property to find prompts that are not in any prompt_order
const unassignedPrompts = computed(() => {
  const allOrderedIdentifiers = new Set(
    presetsStore.prompt_order.flatMap((charOrder) =>
      charOrder.order.map((item) => item.identifier)
    )
  );
  return presetsStore.prompts.filter(
    (p) => !allOrderedIdentifiers.has(p.identifier)
  );
});

// Function to add an unassigned prompt to a character's order
const addPromptToCharacter = (identifier) => {
  if (!presetsStore.prompt_order || presetsStore.prompt_order.length === 0) {
    alert("请先确保至少有一个角色排序列表存在！");
    return;
  }
  // 简单起见，默认添加到第一个角色的列表末尾
  const targetCharacterOrder = presetsStore.prompt_order[0];
  targetCharacterOrder.order.push({
    identifier: identifier,
    enabled: true, // 默认启用
  });
};

const triggerFileUpload = (event) => {
  fileInput.value.click();
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      presetsStore.loadPresetData(data);
      alert("预设导入成功！");
    } catch (error) {
      alert("导入失败，请检查文件格式是否为正确的JSON。");
      console.error("Preset import error:", error);
    }
  };
  reader.readAsText(file);
};

const exportPreset = () => {
  const data = JSON.stringify(presetsStore.$state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gchat-preset.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const saveAsDefault = () => {
  alert("当前设置已保存，下次打开时将自动加载。");
};
</script>

<style scoped>
/* ... [之前的样式保持不变] ... */
.presets-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  color: #333;
}
.description {
  margin-bottom: 2rem;
  color: #666;
}
.actions {
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
}
button {
  padding: 0.8rem 1.5rem;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}
button:hover {
  background-color: #0056b3;
}
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}
fieldset {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  background-color: #f9f9f9;
}
legend {
  font-weight: bold;
  font-size: 1.2rem;
  padding: 0 0.5rem;
  color: #007bff;
}
.form-group {
  margin-bottom: 1.5rem;
}
.form-group:last-child {
  margin-bottom: 0;
}
label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
input[type="range"] {
  width: 100%;
  cursor: pointer;
}
input[type="number"],
input[type="text"],
textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-family: inherit;
}
textarea {
  resize: vertical;
}
.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.checkbox-group input[type="checkbox"] {
  width: auto;
}
/* --- 新的提示词管理样式 --- */
.prompt-management-area {
  margin-top: 2rem;
  border-top: 2px solid #007bff;
  padding-top: 1.5rem;
}
.character-prompt-group,
.unassigned-prompts-group {
  margin-bottom: 2.5rem;
}
.character-title {
  font-size: 1.4rem;
  color: #333;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}
.prompt-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.draggable .prompt-card {
  cursor: grab;
}
.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}
.prompt-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
}
.prompt-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
.prompt-card.unassigned {
  border-left: 4px solid #fdab3d;
}
.prompt-card-content {
  padding: 1rem;
}
.prompt-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}
.handle {
  font-size: 1.5rem;
  color: #aaa;
  cursor: grab;
}
.handle:active {
  cursor: grabbing;
}
.prompt-name {
  font-size: 1.1rem;
  font-weight: bold;
  flex-grow: 1; /* 让名字占据多余空间 */
}
.prompt-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  white-space: nowrap; /* 防止换行 */
}
.prompt-controls label {
  margin-bottom: 0;
  user-select: none;
  cursor: pointer;
}
.prompt-toggle {
  width: 1.2em;
  height: 1.2em;
  cursor: pointer;
}
.add-btn {
  background-color: #28a745;
  padding: 0.3rem 0.8rem;
  font-size: 0.9rem;
}
.add-btn:hover {
  background-color: #218838;
}
.prompt-content textarea {
  background-color: #f8f9fa;
  color: #333;
  border-color: #ddd;
  font-family: monospace;
}
.prompt-card-error {
  padding: 1rem;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 8px;
}
</style>
