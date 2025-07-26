import { defineStore } from "pinia";
import { ref, computed } from "vue";

const defaultEntry = {
  uid: null,
  characterId: null, // (关键新增) 用于关联角色，null 表示全局
  keys: [],
  comment: "新的注释",
  content: "关于关键词的描述...",
  enabled: true,
  // ... 其他高级参数 ...
};

export const useWorldbookStore = defineStore(
  "worldbook",
  () => {
    const entries = ref([]);

    // (关键修改) Getter 现在是函数，可以传入 characterId
    const getEntriesForCharacter = (charId) => {
      return entries.value.filter((e) => e.characterId === charId);
    };
    const globalEntries = computed(() =>
      entries.value.filter((e) => !e.characterId)
    );

    const generateUID = () => Date.now() + Math.random();

    // (关键修改) 添加条目时，可以指定其归属
    function addEntry(characterId = null) {
      const newEntry = {
        ...JSON.parse(JSON.stringify(defaultEntry)),
        uid: generateUID(),
        characterId,
      };
      entries.value.push(newEntry);
    }

    function deleteEntry(uid) {
      const index = entries.value.findIndex((e) => e.uid === uid);
      if (index > -1) entries.value.splice(index, 1);
    }

    // (关键新增) 删除与特定角色关联的所有条目
    function deleteEntriesForCharacter(characterId) {
      entries.value = entries.value.filter(
        (e) => e.characterId !== characterId
      );
    }

    function importWorldbook(jsonData, characterId = null) {
      try {
        const data = JSON.parse(jsonData);
        let importedEntries = [];

        const processEntry = (entryData) => ({
          uid: entryData.uid ?? generateUID(),
          characterId: characterId, // 导入时指定归属
          keys: entryData.key ?? entryData.keys ?? [],
          comment: entryData.comment ?? "",
          content: entryData.content ?? "",
          enabled: entryData.disable !== undefined ? !entryData.disable : true,
        });

        if (data.entries && typeof data.entries === "object") {
          importedEntries = Object.values(data.entries).map(processEntry);
        } else if (Array.isArray(data)) {
          importedEntries = data.map(processEntry);
        } else {
          throw new Error("无效的世界书文件格式。");
        }

        // 将导入的条目添加到现有列表中，而不是覆盖
        entries.value.push(...importedEntries);
        alert("世界书导入成功！");
      } catch (error) {
        alert(`导入失败: ${error.message}`);
        console.error(error);
      }
    }

    function exportWorldbook() {
      // ... 导出逻辑可以保持不变，或者根据需要调整
    }

    function updateEntriesOrder(newOrder) {
      entries.value = newOrder;
    }

    return {
      entries,
      getEntriesForCharacter,
      globalEntries,
      addEntry,
      deleteEntry,
      deleteEntriesForCharacter,
      importWorldbook,
      exportWorldbook,
      updateEntriesOrder,
    };
  },
  {
    persist: true,
  }
);
