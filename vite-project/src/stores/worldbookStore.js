import { defineStore } from "pinia";
import { ref } from "vue";

const defaultEntry = {
  keys: "关键词",
  content: "关于这个关键词的描述...",
  isGlobal: false, // 是否为全局世界书
  enabled: true,
};

export const useWorldbookStore = defineStore(
  "worldbook",
  () => {
    const entries = ref([JSON.parse(JSON.stringify(defaultEntry))]);

    function addEntry() {
      entries.value.push(JSON.parse(JSON.stringify(defaultEntry)));
    }

    function deleteEntry(index) {
      entries.value.splice(index, 1);
    }

    function importWorldbook(jsonData) {
      try {
        const data = JSON.parse(jsonData);
        if (Array.isArray(data)) {
          entries.value = data;
          alert("世界书导入成功！");
        } else {
          throw new Error("无效的世界书文件格式，应为一个数组。");
        }
      } catch (error) {
        alert(`导入失败: ${error.message}`);
      }
    }

    function exportWorldbook() {
      const dataStr = JSON.stringify(entries.value, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "worldbook.json";
      link.click();
      URL.revokeObjectURL(url);
    }

    return {
      entries,
      addEntry,
      deleteEntry,
      importWorldbook,
      exportWorldbook,
    };
  },
  {
    persist: true,
  }
);
