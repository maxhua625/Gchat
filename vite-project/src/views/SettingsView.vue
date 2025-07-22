<template>
  <div class="settings-page">
    <h2>应用设置</h2>

    <!-- OpenAI 设置区域 -->
    <div class="settings-card">
      <h3>OpenAI API</h3>
      <div class="form-group">
        <label for="openai-url">API 地址</label>
        <input
          id="openai-url"
          type="text"
          v-model="settings.openai.baseURL"
          placeholder="例如：https://api.openai.com"
        />
      </div>
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
        <button
          @click="testConnection('openai')"
          :disabled="testing.openai || !settings.openai.baseURL"
        >
          {{ testing.openai ? "测试中..." : "测试连接" }}
        </button>
        <span
          v-if="settings.openai.connected"
          class="success-icon"
          title="连接成功"
          >✅</span
        >
      </div>

      <!-- **这里是修正后的模型选择框** -->
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
            :selected="
              model.id === settings.activeModel.modelName &&
              settings.activeModel.provider === 'openai'
            "
          >
            {{ model.id }}
          </option>
        </select>
      </div>
    </div>

    <!-- Gemini 设置区域 -->
    <div class="settings-card">
      <h3>Google Gemini API</h3>
      <div class="form-group">
        <label for="gemini-url">API 地址</label>
        <input
          id="gemini-url"
          type="text"
          v-model="settings.gemini.baseURL"
          placeholder="例如：https://generativelanguage.googleapis.com"
        />
      </div>
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
        <button
          @click="testConnection('gemini')"
          :disabled="testing.gemini || !settings.gemini.baseURL"
        >
          {{ testing.gemini ? "测试中..." : "测试连接" }}
        </button>
        <span
          v-if="settings.gemini.connected"
          class="success-icon"
          title="连接成功"
          >✅</span
        >
      </div>

      <!-- **这里是修正后的模型选择框** -->
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
              model.name.split('/')[1] === settings.activeModel.modelName &&
              settings.activeModel.provider === 'gemini'
            "
          >
            {{ model.name.split("/")[1] }}
          </option>
        </select>
      </div>
    </div>

    <p class="info">所有设置将自动保存在您的浏览器中。</p>
    <p class="info cors-info">
      注意：为了解决浏览器跨域问题，所有请求将通过一个公共代理服务进行。
    </p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useSettingsStore } from "@/store/settingsStore";
import api from "@/api";

const settings = useSettingsStore();
const testing = ref({ openai: false, gemini: false });

// **这是解决 CORS 问题的关键**
const corsProxy = "https://cors-anywhere.herokuapp.com/";

const testConnection = async (provider) => {
  testing.value[provider] = true;
  settings[provider].connected = false;

  const apiKey = settings[provider].apiKey;
  // **将用户输入的 URL 与 CORS 代理地址拼接**
  const baseURL = corsProxy + settings[provider].baseURL;

  try {
    let response;
    if (provider === "openai") {
      response = await api.openai.fetchOpenAIModels(apiKey, baseURL);
      settings.openai.models = response.data
        .filter((m) => m.id.includes("gpt"))
        .sort((a, b) => b.id.localeCompare(a.id));
    } else if (provider === "gemini") {
      response = await api.gemini.fetchGeminiModels(apiKey, baseURL);
      settings.gemini.models = response.models.filter((m) =>
        m.supportedGenerationMethods.includes("generateContent")
      );
    }
    settings[provider].connected = true;
    alert(`${provider.toUpperCase()} 连接成功!`);
  } catch (error) {
    alert(`连接失败: ${error.message}\n请检查 API 地址、密钥以及网络连接。`);
    console.error(error);
  } finally {
    testing.value[provider] = false;
  }
};

const updateActiveModel = (provider, modelName) => {
  settings.activeModel = { provider, modelName };
  alert(`默认模型已切换为: ${provider.toUpperCase()} - ${modelName}`);
};
</script>

<style scoped>
/* 样式与之前基本相同，只增加一个 cors-info 的样式 */
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
  font-weight: bold;
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
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}
button:disabled {
  background-color: #cccccc;
}
.success-icon {
  font-size: 1.5rem;
}
.info {
  text-align: center;
  color: #888;
}
.cors-info {
  font-size: 0.8rem;
  margin-top: 2rem;
}
</style>
