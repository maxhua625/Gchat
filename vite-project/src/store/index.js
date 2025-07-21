import { reactive, onMounted } from "vue";

// 使用 reactive 创建一个响应式的全局状态对象
export const store = reactive({
  // API 配置状态
  apiConfig: {
    url: "",
    key: "",
    model: "",
  },

  // 智能体状态
  agent: {
    name: "默认助手",
    systemPrompt: "你是一个由 Vue 和 Vite 构建的 AI 助手。",
    worldBook: "",
  },

  // 聊天记录
  messages: [],

  // 是否正在生成中
  isGenerating: false,
});

// 提供一个可复用的函数来从 localStorage 加载数据
export function useInitialLoad() {
  onMounted(() => {
    store.apiConfig.url = localStorage.getItem("api_url") || "";
    store.apiConfig.key = localStorage.getItem("api_key") || "";
    store.apiConfig.model = localStorage.getItem("selected_model") || "";

    const savedAgent = localStorage.getItem("agent");
    if (savedAgent) {
      try {
        store.agent = JSON.parse(savedAgent);
      } catch (e) {
        console.error("Failed to parse agent from localStorage", e);
      }
    }

    if (store.messages.length === 0) {
      store.messages.push({
        id: Date.now(),
        role: "assistant",
        content: "你好！请先在“设置”页面配置 API，然后我们就可以开始聊天了。",
      });
    }
  });
}
