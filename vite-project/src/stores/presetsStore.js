import { defineStore } from "pinia";
import { ref, computed } from "vue";

const defaultPreset = {
  name: "新建预设",
  // --- 原有参数 ---
  temperature: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
  top_p: 1,
  top_k: 40,
  repetition_penalty: 1,

  // --- (关键新增) 新的模型参数 ---
  max_context_tokens: 4096, // 上下文长度
  max_tokens: 2048, // 最大回复长度
  n: 1, // 备选回复数
  stream: true, // 是否流式传输
  image_support: false, // 是否能发送图片 (前端控制)
  request_chain_of_thought: false, // 是否请求思维链 (前端控制)

  // --- 原有提示词 ---
  prompts: [
    {
      name: "主提示词",
      system_prompt: true,
      role: "user",
      content: "请在这里输入你的主提示词...",
      enabled: true,
      injection_position: 0,
      injection_depth: 4,
      forbid_overrides: false,
    },
  ],
};

export const usePresetsStore = defineStore(
  "presets",
  () => {
    const presetsList = ref([JSON.parse(JSON.stringify(defaultPreset))]);
    const activePresetIndex = ref(0);

    const activePreset = computed(
      () => presetsList.value[activePresetIndex.value]
    );

    function addNewPreset() {
      const newPreset = JSON.parse(JSON.stringify(defaultPreset));
      newPreset.name = `新建预设 ${presetsList.value.length + 1}`;
      presetsList.value.push(newPreset);
      activePresetIndex.value = presetsList.value.length - 1;
    }

    function deletePreset(index) {
      if (presetsList.value.length <= 1) {
        alert("至少需要保留一个预设！");
        return;
      }
      presetsList.value.splice(index, 1);
      if (activePresetIndex.value >= index) {
        activePresetIndex.value = Math.max(0, activePresetIndex.value - 1);
      }
    }

    function importPreset(jsonData) {
      try {
        const importedData = JSON.parse(jsonData);
        if (!importedData.prompts || !Array.isArray(importedData.prompts)) {
          throw new Error("无效的预设文件格式，缺少 prompts 数组。");
        }

        importedData.prompts.forEach((prompt) => {
          if (prompt.enabled === undefined) prompt.enabled = true;
          if (prompt.injection_position === undefined)
            prompt.injection_position = 0;
          if (prompt.injection_depth === undefined) prompt.injection_depth = 4;
          if (prompt.forbid_overrides === undefined)
            prompt.forbid_overrides = false;
          if (prompt.system_prompt === undefined) prompt.system_prompt = false;
        });

        // (关键修改) 为导入的数据补充可能缺失的新参数
        Object.keys(defaultPreset).forEach((key) => {
          if (importedData[key] === undefined) {
            importedData[key] = defaultPreset[key];
          }
        });

        if (!importedData.name) {
          importedData.name = `导入的预设 ${new Date().toLocaleTimeString()}`;
        }

        presetsList.value.push(importedData);
        activePresetIndex.value = presetsList.value.length - 1;
        alert("预设导入成功！");
      } catch (error) {
        alert(`导入失败: ${error.message}`);
        console.error(error);
      }
    }

    return {
      presetsList,
      activePresetIndex,
      activePreset,
      addNewPreset,
      deletePreset,
      importPreset,
    };
  },
  {
    persist: true,
  }
);
