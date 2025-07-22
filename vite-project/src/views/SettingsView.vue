<template>
  <div class="settings-page">
    <h2>应用设置</h2>

    <!-- OpenAI 设置卡片 (保持不变) -->
    <div class="settings-card">
      <h3>OpenAI API</h3>
      <div class="form-group">
        <label for="openai-key">API 密钥 (sk-...)</label>
        <input
          id="openai-key"
          type="password"
          v-model="settings.openai.apiKey"
          placeholder="请输入你的 OpenAI API Key"
        />
      </div>
      <div class="button-group">
        <button @click="testConnection('openai')" :disabled="testing.openai">
          {{ testing.openai ? "测试中..." : "测试连接" }}
        </button>
        <span
          v-if="settings.openai.connected"
          class="success-icon"
          title="连接成功"
          >✅</span
        >
      </div>
      <div v-if="settings.openai.connected" class="form-group model-selector">
        <label for="openai-model">选择默认模型</label>
        <select
          id="openai-model"
          @change="updateActiveModel('openai', $event.target.value)"
        >
          <option
            v-for="model in settings.openai.models"
            :key="model.id"
            :value="model.id"
            :selected="model.id === settings.activeModel.modelName"
          >
            {{ model.id }}
          </option>
        </select>
      </div>
    </div>

    <!-- Gemini 设置卡片 (保持不变) -->
    <div class="settings-card">
      <h3>Google Gemini API</h3>
      <div class="form-group">
        <label for="gemini-key">API 密钥</label>
        <input
          id="gemini-key"
          type="password"
          v-model="settings.gemini.apiKey"
          placeholder="请输入你的 Gemini API Key"
        />
      </div>
      <div class="button-group">
        <button @click="testConnection('gemini')" :disabled="testing.gemini">
          {{ testing.gemini ? "测试中..." : "测试连接" }}
        </button>
        <span
          v-if="settings.gemini.connected"
          class="success-icon"
          title="连接成功"
          >✅</span
        >
      </div>
      <div v-if="settings.gemini.connected" class="form-group model-selector">
        <label for="gemini-model">选择默认模型</label>
        <select
          id="gemini-model"
          @change="updateActiveModel('gemini', $event.target.value)"
        >
          <option
            v-for="model in settings.gemini.models"
            :key="model.name"
            :value="model.name.split('/')[1]"
            :selected="
              model.name.split('/')[1] === settings.activeModel.modelName
            "
          >
            {{ model.name.split("/")[1] }}
          </option>
        </select>
      </div>
    </div>

    <!-- (关键新增) DeepSeek 设置卡片 -->
    <div class="settings-card">
      <h3>DeepSeek API</h3>
      <div class="form-group">
        <label for="deepseek-key">API 密钥 (sk-...)</label>
        <input
          id="deepseek-key"
          type="password"
          v-model="settings.deepseek.apiKey"
          placeholder="请输入你的 DeepSeek API Key"
        />
      </div>
      <div class="button-group">
        <button
          @click="testConnection('deepseek')"
          :disabled="testing.deepseek"
        >
          {{ testing.deepseek ? "测试中..." : "测试连接" }}
        </button>
        <span
          v-if="settings.deepseek.connected"
          class="success-icon"
          title="连接成功"
          >✅</span
        >
      </div>
      <div v-if="settings.deepseek.connected" class="form-group model-selector">
        <label for="deepseek-model">选择默认模型</label>
        <select
          id="deepseek-model"
          @change="updateActiveModel('deepseek', $event.target.value)"
        >
          <option
            v-for="model in settings.deepseek.models"
            :key="model.id"
            :value="model.id"
            :selected="model.id === settings.activeModel.modelName"
          >
            {{ model.id }}
          </option>
        </select>
      </div>
    </div>

    <p class="info">所有设置将自动保存在您的浏览器中。</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useSettingsStore } from "@/stores/settingsStore";
import api from "@/api";

const settings = useSettingsStore();

const testing = ref({
  openai: false,
  gemini: false,
  deepseek: false, // 新增
});

const testConnection = async (provider) => {
  testing.value[provider] = true;
  settings[provider].connected = false;

  const apiKey = settings[provider].apiKey;

  try {
    let response;
    if (provider === "openai") {
      response = await api.openai.fetchOpenAIModels(apiKey);
      settings.openai.models = response.data
        .filter((m) => m.id.includes("gpt"))
        .sort((a, b) => b.id.localeCompare(a.id));
    } else if (provider === "gemini") {
      response = await api.gemini.fetchGeminiModels(apiKey);
      settings.gemini.models = response.models.filter((m) =>
        m.supportedGenerationMethods.includes("generateContent")
      );
    } else if (provider === "deepseek") {
      // (关键新增)
      response = await api.deepseek.fetchDeepseekModels(apiKey);
      settings.deepseek.models = response.data
        .filter((m) => m.id.includes("deepseek"))
        .sort((a, b) => b.id.localeCompare(a.id));
    }
    settings[provider].connected = true;
    alert(`${provider.toUpperCase()} 连接成功!`);
  } catch (error) {
    alert(`连接失败: ${error.response?.data?.error || error.message}`);
    console.error(error);
  } finally {
    testing.value[provider] = false;
  }
};

const updateActiveModel = (provider, modelName) => {
  settings.activeModel = { provider, modelName };
  alert(`默认模型已切换为: ${provider} - ${modelName}`);
};
</script>

<style scoped>
/* 样式保持不变 */
.settings-page {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}
.settings-card {
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.form-group {
  margin-bottom: 1rem;
}
.model-selector {
  margin-top: 1.5rem;
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
}
label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 700;
}
input,
select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
.button-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}
button {
  padding: 0.75rem 1.5rem;
  border: none;
  background-color: #4caf50;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}
button:disabled {
  background-color: #ccc;
}
.success-icon {
  font-size: 1.5rem;
}
.info {
  text-align: center;
  color: #888;
}
</style>
