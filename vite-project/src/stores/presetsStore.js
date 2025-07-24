import { defineStore } from "pinia";
import { ref, computed } from "vue";

const defaultPreset = {
  name: "新建预设",
  temperature: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
  top_p: 1,
  top_k: 40,
  repetition_penalty: 1,
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

        // (关键修改) 确保每个导入的 prompt 都有所有必要的属性
        importedData.prompts.forEach((prompt) => {
          // 如果 enabled 属性不存在 (undefined)，则默认为 true
          if (prompt.enabled === undefined) {
            prompt.enabled = true;
          }
          // 为旧格式或不完整的格式补充默认值
          if (prompt.injection_position === undefined)
            prompt.injection_position = 0;
          if (prompt.injection_depth === undefined) prompt.injection_depth = 4;
          if (prompt.forbid_overrides === undefined)
            prompt.forbid_overrides = false;
          if (prompt.system_prompt === undefined) prompt.system_prompt = false;
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
