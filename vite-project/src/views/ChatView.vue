<template>
  <div class="chat-wrapper">
    <div class="chat-info-header">
      当前模型:
      <strong
        >{{ settings.activeModel.provider }} /
        {{ settings.activeModel.modelName }}</strong
      >
      | 当前预设: <strong>{{ presets.activePreset.name }}</strong>
    </div>

    <div class="message-list" ref="messageListRef">
      <Message
        v-for="(item, index) in chat.history"
        :key="index"
        :item="item"
      />
      <div v-if="isLoading" class="loading-indicator">
        <Message :item="{ role: 'assistant', content: '...' }" />
      </div>
    </div>

    <div class="chat-input-area">
      <form @submit.prevent="sendMessage" class="input-form">
        <input
          type="text"
          v-model="userInput"
          placeholder="在这里输入您的消息..."
          :disabled="isLoading"
        />
        <button type="submit" :disabled="isLoading || !userInput">
          <span v-if="!isLoading">发送</span>
          <span v-else>思考中...</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from "vue";
import Message from "@/components/Message.vue";
import api from "@/api";
import { useChatStore } from "@/stores/chatStore";
import { useSettingsStore } from "@/stores/settingsStore";
// 1. 导入新的 stores
import { usePresetsStore } from "@/stores/presetsStore";
import { useWorldbookStore } from "@/stores/worldbookStore";

const chat = useChatStore();
const settings = useSettingsStore();
// 2. 使用新的 stores
const presets = usePresetsStore();
const worldbook = useWorldbookStore();

const userInput = ref("");
const isLoading = ref(false);
const messageListRef = ref(null);

// 3. (核心逻辑) 构建最终发送给 API 的消息数组
const buildFinalMessages = () => {
  const finalMessages = [];
  const activePreset = presets.activePreset;
  const lastMessage = userInput.value;

  // 注入世界书内容
  worldbook.entries.forEach((entry) => {
    if (entry.enabled) {
      const keywords = entry.keys.split(",").map((k) => k.trim());
      // 如果是全局条目，或者最后一个用户消息包含关键词
      if (entry.isGlobal || keywords.some((k) => lastMessage.includes(k))) {
        // 简单地将世界书内容作为一个 system 消息注入
        finalMessages.push({
          role: "system",
          content: `[World Info: ${entry.content}]`,
        });
      }
    }
  });

  // 注入预设中的提示词
  if (activePreset && activePreset.prompts) {
    activePreset.prompts.forEach((prompt) => {
      if (prompt.enabled && prompt.content) {
        finalMessages.push({
          role: prompt.role || "system",
          content: prompt.content,
        });
      }
    });
  }

  // 添加聊天历史
  finalMessages.push(...JSON.parse(JSON.stringify(chat.history)));

  return finalMessages;
};

const sendMessage = async () => {
  if (!userInput.value || isLoading.value) return;

  const provider = settings.activeModel.provider;
  const config = settings.providerConfig[provider];
  const activeModelName = settings.activeModel.modelName;

  if (!config || !config.apiKey) {
    alert(`请先在设置页面配置 ${provider.toUpperCase()} 的 API Key!`);
    return;
  }

  isLoading.value = true;

  // 4. 将用户当前输入的消息先添加到历史记录中
  chat.addMessage({ role: "user", content: userInput.value });
  // 5. 构建包含所有上下文的最终消息列表
  const finalMessages = buildFinalMessages();

  userInput.value = ""; // 清空输入框

  try {
    let response;

    // 获取预设中的模型参数，如果不存在则使用默认值
    const activePreset = presets.activePreset;
    const modelParams = {
      model: activeModelName,
      temperature: activePreset?.temperature ?? 1.0,
      top_p: activePreset?.top_p ?? 1.0,
      top_k: activePreset?.top_k ?? 40,
      // ...可以添加更多参数
    };

    if (provider === "gemini") {
      // Gemini 需要不同的消息格式
      const contentsForAPI = {
        contents: finalMessages.map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })),
      };
      response = await api.gemini.fetchGeminiCompletion(
        activeModelName,
        contentsForAPI,
        config.apiKey
      );
      const assistantMessageText = response.candidates[0].content.parts[0].text;
      chat.addMessage({
        role: "assistant",
        content: assistantMessageText.trim(),
      });
    } else {
      // OpenAI, DeepSeek, Custom 共享相同的逻辑
      const params = { ...modelParams, messages: finalMessages };
      let fetchFunc;
      if (provider === "custom") {
        fetchFunc = api.custom.fetchCustomChatCompletion;
        response = await fetchFunc(params, config.apiKey, config.baseURL);
      } else {
        fetchFunc =
          api[provider].fetchOpenAIChatCompletion ||
          api[provider].fetchDeepseekChatCompletion;
        response = await fetchFunc(params, config.apiKey);
      }
      chat.addMessage(response.choices[0].message);
    }
  } catch (error) {
    const errorMessage = `获取回复失败: ${
      error.response?.data?.error?.message || error.message
    }`;
    chat.addMessage({ role: "assistant", content: errorMessage });
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

const scrollToBottom = async () => {
  await nextTick();
  const listEl = messageListRef.value;
  if (listEl) {
    listEl.scrollTop = listEl.scrollHeight;
  }
};

watch(
  () => chat.history.length,
  () => {
    scrollToBottom();
  }
);

onMounted(() => {
  scrollToBottom();
});
</script>

<style scoped>
/* Scoped styles from your previous request */
.chat-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.chat-info-header {
  padding: 0.75rem 1rem;
  background-color: #f7f7f7;
  border-bottom: 1px solid #e0e0e0;
  text-align: center;
  color: #333;
  flex-shrink: 0;
}
.message-list {
  flex-grow: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: #f0f2f5;
}
.chat-input-area {
  padding: 1rem;
  background-color: #fff;
  border-top: 1px solid #d9d9d9;
  flex-shrink: 0;
}
.input-form {
  display: flex;
  gap: 0.5rem;
  max-width: 800px;
  margin: 0 auto;
}
.input-form input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
}
.input-form input:focus {
  outline: 0;
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}
.input-form button {
  padding: 0.75rem 1.5rem;
  border: none;
  background-color: #4caf50;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}
.input-form button:disabled {
  background-color: #ccc;
}
</style>
