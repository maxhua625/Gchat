<template>
  <div class="settings-page">
    <h2>应用设置</h2>

    <!-- OpenAI 设置区域 -->
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
        <!-- 连接成功后显示图标 -->
        <span v-if="settings.openai.connected" class="success-icon">✅</span>
      </div>

      <!-- 连接成功后显示模型选择 -->
      <div v-if="settings.openai.connected" class="form-group">
        <label for="openai-model">选择模型</label>
        <select
          id="openai-model"
          v-model="settings.activeModel"
          @change="updateActiveModel('openai', $event)"
        >
          <option
            v-for="model in settings.openai.models"
            :key="model.id || model"
            :value="{ provider: 'openai', modelName: model.id || model }"
          >
            {{ model.id || model }}
          </option>
        </select>
      </div>
    </div>

    <!-- Gemini 设置区域 -->
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
        <span v-if="settings.gemini.connected" class="success-icon">✅</span>
      </div>

      <div v-if="settings.gemini.connected" class="form-group">
        <label for="gemini-model">选择模型</label>
        <select
          id="gemini-model"
          v-model="settings.activeModel"
          @change="updateActiveModel('gemini', $event)"
        >
          <option
            v-for="model in settings.gemini.models"
            :key="model.name"
            :value="{ provider: 'gemini', modelName: model.name.split('/')[1] }"
          >
            {{ model.name.split("/")[1] }}
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
});

const testConnection = async (provider) => {
  testing.value[provider] = true;
  settings[provider].connected = false; // 重置连接状态

  try {
    let response;
    if (provider === "openai") {
      response = await api.openai.fetchOpenAIModels(settings.openai.apiKey);
      // 过滤出 gpt 模型并保存
      settings.openai.models = response.data
        .filter((m) => m.id.includes("gpt"))
        .sort((a, b) => b.id.localeCompare(a.id));
    } else if (provider === "gemini") {
      response = await api.gemini.fetchGeminiModels(settings.gemini.apiKey);
      // 过滤出包含 generateContent 的模型
      settings.gemini.models = response.models.filter((m) =>
        m.supportedGenerationMethods.includes("generateContent")
      );
    }
    settings[provider].connected = true;
    alert(`${provider.toUpperCase()} 连接成功!`);
  } catch (error) {
    alert(`连接失败: ${error.message}`);
    console.error(error);
  } finally {
    testing.value[provider] = false;
  }
};

// 这个函数是必要的，因为 v-model 在 select 和 option value 是对象时工作方式有点特殊
const updateActiveModel = (provider, event) => {
  // event.target.value 在这种情况下是字符串 "[object Object]"
  // 我们需要从 DOM 元素上找到选中的 option，并从中解析出我们的对象
  const selectedOption = event.target.options[event.target.selectedIndex];
  if (selectedOption?._value) {
    settings.activeModel = selectedOption._value;
  }
};
</script>

<style scoped>
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
</style>
