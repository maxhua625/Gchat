import { defineStore } from "pinia";
import { ref, computed } from "vue";

// 定义一个标准的、包含所有必要字段的世界书条目模板
const defaultEntry = {
  uid: null, // 将用于唯一标识
  keys: [], // 主关键词
  comment: "新的注释", // 注释
  content: "关于关键词的描述...", // 内容
  isGlobal: false, // (关键) 我们将用这个字段来区分全局和局部
  enabled: true, // 我们自己的启用开关，替代 disable

  // 保留并兼容高级参数，并设置合理的默认值
  order: 100,
  position: 4, // 'before'/'after' enum like behavior
  depth: 4,
  probability: 100,
  useProbability: true,
};

export const useWorldbookStore = defineStore(
  "worldbook",
  () => {
    const entries = ref([]);

    // (关键新增) 使用计算属性来动态筛选全局和局部世界书
    const globalEntries = computed(() =>
      entries.value.filter((e) => e.isGlobal)
    );
    const localEntries = computed(() =>
      entries.value.filter((e) => !e.isGlobal)
    );

    // 为新条目生成一个唯一的 UID
    const generateUID = () => {
      return Date.now() + Math.random();
    };

    function addEntry(isGlobal = false) {
      const newEntry = JSON.parse(JSON.stringify(defaultEntry));
      newEntry.uid = generateUID();
      newEntry.isGlobal = isGlobal;
      entries.value.push(newEntry);
    }

    function deleteEntry(uid) {
      const index = entries.value.findIndex((e) => e.uid === uid);
      if (index > -1) {
        entries.value.splice(index, 1);
      }
    }

    // (关键修改) 强大的智能导入函数
    function importWorldbook(jsonData) {
      try {
        const data = JSON.parse(jsonData);
        let importedEntries = [];

        // 智能判断是新格式 (带 entries 的对象) 还是旧格式 (数组)
        if (data.entries && typeof data.entries === "object") {
          // 新格式：将对象转换为数组
          importedEntries = Object.values(data.entries).map((entry) => ({
            uid: entry.uid ?? generateUID(),
            keys: entry.key ?? [], // 兼容 key 字段
            comment: entry.comment ?? "",
            content: entry.content ?? "",
            isGlobal: entry.isGlobal ?? false,
            enabled: !entry.disable, // 将 disable 转换为 enabled
            order: entry.order ?? 100,
            position: entry.position ?? 4,
            depth: entry.depth ?? 4,
            probability: entry.probability ?? 100,
            useProbability: entry.useProbability ?? true,
          }));
        } else if (Array.isArray(data)) {
          // 旧格式：直接使用，并补充必要的字段
          importedEntries = data.map((entry) => ({
            ...defaultEntry,
            ...entry,
            uid: entry.uid ?? generateUID(),
          }));
        } else {
          throw new Error("无效的世界书文件格式。");
        }

        entries.value = importedEntries;
        alert("世界书导入成功！");
      } catch (error) {
        alert(`导入失败: ${error.message}`);
        console.error(error);
      }
    }

    function exportWorldbook() {
      // 导出时，我们可以选择导出为兼容的格式
      const exportData = {
        entries: entries.value.reduce((acc, entry, index) => {
          acc[index] = {
            uid: entry.uid,
            key: entry.keys,
            comment: entry.comment,
            content: entry.content,
            disable: !entry.enabled,
            // ...可以添加其他高级参数的映射
          };
          return acc;
        }, {}),
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "worldbook.json";
      link.click();
      URL.revokeObjectURL(url);
    }

    // (关键新增) 用于更新拖拽后的数组顺序
    function updateEntriesOrder(newOrder) {
      entries.value = newOrder;
    }

    return {
      entries,
      globalEntries,
      localEntries,
      addEntry,
      deleteEntry,
      importWorldbook,
      exportWorldbook,
      updateEntriesOrder,
    };
  },
  {
    persist: true,
  }
);
