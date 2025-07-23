<template>
  <div class="settings-page">
    <h2>应用设置</h2>

    <!-- 这是我们唯一的、统一的设置卡片 -->
    <div class="settings-card">
      <!-- 1. API 提供商选择器 -->
      <div class="form-group">
        <label for="provider-select">选择 API 提供商</label>
        <select id="provider-select" v-model="selectedProvider">
          <option value="openai">OpenAI</option>
          <option value="gemini">Google Gemini</option>
          <option value="deepseek">DeepSeek</option>
          <option value="custom">自定义 (兼容 OpenAI 格式)</option>
        </select>
      </div>

      <!-- 分隔线 -->
      <hr class="divider" />

      <!-- 2. 根据选择，动态显示对应的设置项 -->

      <!-- 自定义 API 的 URL 输入框 -->
      <div v-if="selectedProvider === 'custom'" class="form-group">
        <label for="custom-url">API 地址 (例如: http://my-proxy.com)</label>
        <input
          id="custom-url"
          type="text"
          v-model="config.baseURL"
          placeholder="请输入你的反向代理或第三方 API 地址"
        />
      </div>

      <!-- 通用的 API 密钥输入框 -->
      <div class="form-group">
        <label for="api-key">API 密钥</label>
        <input
          id="api-key"
          type="password"
          v-model="config.apiKey"
          placeholder="请输入 API Key"
        />
      </div>

      <!-- 统一的按钮和状态显示 -->
      <div class="button-group">
        <button @click="testConnection" :disabled="testing">
          {{ testing ? "测试中..." : "测试连接" }}
        </button>
        <span v-if="config.connected" class="success-icon" title="连接成功"
          >✅</span
        >
      </div>

      <!-- 统一的模型选择框 -->
      <div v-if="config.connected" class="form-group model-selector">
        <label for="model-select">选择默认模型</label>
        <select
          id="model-select"
          @change="updateActiveModel($event.target.value)"
        >
          <option
            v-for="model in config.models"
            :key="model.id || model.name"
            :value="getModelName(model)"
            :selected="getModelName(model) === settings.activeModel.modelName"
          >
            {{ getModelName(model) }}
          </option>
        </select>
      </div>
    </div>

    <p class="info">所有设置将自动保存在您的浏览器中。</p>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useSettingsStore } from "@/stores/settingsStore";
import api from "@/api";

const settings = useSettingsStore();

// 本地状态，用于控制当前选中的提供商
const selectedProvider = ref(settings.activeModel.provider);
const testing = ref(false);

// 计算属性，根据 selectedProvider 动态返回对应的配置对象
// 这是让界面响应式的关键！
const config = computed(() => {
  return settings.providerConfig[selectedProvider.value];
});

// 从模型对象中提取名称的辅助函数
const getModelName = (model) => {
  // Gemini 的模型名称在 model.name 里，格式为 "models/gemini-pro"
  if (selectedProvider.value === "gemini") {
    return model.name.split("/")[1];
  }
  // 其他的都在 model.id 里
  return model.id;
};

const testConnection = async () => {
  testing.value = true;
  config.value.connected = false; // 重置连接状态

  const provider = selectedProvider.value;
  const apiKey = config.value.apiKey;

  try {
    let response;
    // 使用新的、统一的 API 调用方式
    const fetchModelsFunc =
      api[provider].fetchOpenAIModels ||
      api[provider].fetchGeminiModels ||
      api[provider].fetchCustomModels ||
      api[provider].fetchDeepseekModels;

    if (provider === "custom") {
      const baseURL = config.value.baseURL;
      if (!baseURL) throw new Error("自定义 API 地址不能为空!");
      response = await fetchModelsFunc(apiKey, baseURL);
      config.value.models = response.data;
    } else {
      response = await fetchModelsFunc(apiKey);
    }

    // 根据不同的 provider 解析 models
    if (provider === "gemini") {
      config.value.models = response.models.filter((m) =>
        m.supportedGenerationMethods.includes("generateContent")
      );
    } else {
      // OpenAI, DeepSeek, Custom 都遵循 data 数组的格式
      config.value.models = response.data.sort((a, b) =>
        b.id.localeCompare(a.id)
      );
    }

    config.value.connected = true;
    alert(`${provider.toUpperCase()} 连接成功!`);
  } catch (error) {
    alert(`连接失败: ${error.response?.data?.error || error.message}`);
    console.error(error);
  } finally {
    testing.value = false;
  }
};

const updateActiveModel = (modelName) => {
  settings.activeModel = { provider: selectedProvider.value, modelName };
  alert(`默认模型已切换为: ${selectedProvider.value} - ${modelName}`);
};
</script>

<style scoped>
.settings-page {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}
.settings-card {
  background: #fff;
  padding: 1.5rem 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.form-group {
  margin-bottom: 1.5rem;
}
.divider {
  border: none;
  border-top: 1px solid #eee;
  margin: 2rem 0;
}
.model-selector {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
}
label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #333;
}
input,
select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 1rem;
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
  transition: background-color 0.2s;
}
button:hover {
  background-color: #45a049;
}
button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
.success-icon {
  font-size: 1.5rem;
}
.info {
  text-align: center;
  color: #888;
  margin-top: 2rem;
}
</style>
