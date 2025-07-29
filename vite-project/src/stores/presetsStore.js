import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid";

// 1. 创建一个返回初始状态的函数，这是修复响应性问题的关键
const getInitialState = () => ({
  // 基本采样参数
  temperature: 1.15,
  frequency_penalty: 0,
  presence_penalty: 0,
  top_p: 0.98,
  top_k: 40,
  top_a: 0,
  min_p: 0,
  repetition_penalty: 1,
  seed: -1,
  n: 1,

  // 模型上下文和Token限制
  openai_max_context: 1000000,
  openai_max_tokens: 65535,
  max_context_unlocked: true,

  // 格式化与行为控制
  wrap_in_quotes: false,
  names_behavior: 0,
  send_if_empty: "",
  impersonation_prompt:
    "[Write your next reply from the point of view of {{user}}, using the chat history so far as a guideline for the writing style of {{user}}. Write 1 reply only in internet RP style. Don't write as {{char}} or system. Don't describe actions of {{char}}.]",
  new_chat_prompt: "",
  new_group_chat_prompt: "",
  new_example_chat_prompt: "",
  continue_nudge_prompt:
    "[Continue the following message. Do not include ANY parts of the original message. Use capitalization and punctuation as if your reply is a part of the original message: {{lastChatMessage}}]",
  group_nudge_prompt: "",
  wi_format: "{0}",
  scenario_format: "[Circumstances and context of the dialogue: {{scenario}}]",
  personality_format: "[{{char}}'s personality: {{personality}}]",

  // API 和代理
  reverse_proxy: "",
  proxy_password: "",
  api_url_scale: "",

  // 提示词 (Prompts) 管理
  prompts: [],
  prompt_order: [],
  bias_preset_selected: "Default (none)",

  // 高级/实验性功能
  stream_openai: false,
  show_external_models: false,
  assistant_prefill: "",
  assistant_impersonation: "",
  claude_use_sysprompt: false,
  use_makersuite_sysprompt: false,
  use_alt_scale: false,
  squash_system_messages: false,
  image_inlining: true,
  inline_image_quality: "low",
  bypass_status_check: false,
  continue_prefill: true,
  continue_postfix: " ",
  function_calling: true,
  show_thoughts: false,
  reasoning_effort: "auto",
  enable_web_search: false,
  request_images: false,
});

export const usePresetsStore = defineStore("presets", {
  state: () => getInitialState(),

  actions: {
    // 2. 重写加载逻辑，以保证响应性并避免状态污染
    loadPresetData(data) {
      console.log("Loading preset data:", data);
      // 创建一个干净的、全新的状态对象副本
      const newState = getInitialState();

      // 将导入数据(data)的键值合并到新状态对象中
      for (const key in newState) {
        if (data.hasOwnProperty(key)) {
          newState[key] = data[key];
        }
      }

      // 使用 $patch 安全地应用所有更改，这会保留响应性
      this.$patch(newState);
      console.log("Preset loaded and state patched.");
    },

    // 添加一个新的空提示
    addPrompt() {
      this.prompts.push({
        name: "New Prompt",
        system_prompt: false,
        role: "user",
        content: "",
        identifier: uuidv4(),
        forbid_overrides: false,
        injection_position: 0,
        injection_depth: 4,
        injection_order: 100,
        enabled: true,
        marker: false,
      });
    },

    // 3. 添加删除提示的 action
    deletePrompt(identifier) {
      this.prompts = this.prompts.filter((p) => p.identifier !== identifier);
      // 可选：同时从 prompt_order 中移除
      this.prompt_order.forEach((characterOrder) => {
        characterOrder.order = characterOrder.order.filter(
          (item) => item.identifier !== identifier
        );
      });
    },

    // Action 来重置状态为默认值
    resetToDefaults() {
      this.$patch(getInitialState());
      console.log("State has been reset to defaults.");
    },
  },
  persist: true,
});
