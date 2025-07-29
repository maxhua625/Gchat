import { defineStore } from "pinia";
import { ref, computed } from "vue";

const defaultAgent = {
  id: null,
  name: "新角色",
  first_mes: "",
};

const defaultLorebookEntry = {
  uid: null,
  characterId: null,
  keys: [],
  comment: "新的注释",
  content: "关于关键词的描述...",
  enabled: true,
};

export const useAgentStore = defineStore(
  "agent",
  () => {
    const agentList = ref([
      {
        ...JSON.parse(JSON.stringify(defaultAgent)),
        id: crypto.randomUUID(),
        name: "默认助手",
        first_mes: "你好，我是你的默认助手！",
      },
    ]);
    const activeAgentId = ref(
      agentList.value.length > 0 ? agentList.value[0].id : null
    );
    const lorebookEntries = ref([]);

    const activeAgent = computed(() =>
      agentList.value.find((c) => c.id === activeAgentId.value)
    );
    const globalLorebookEntries = computed(() =>
      lorebookEntries.value.filter((e) => !e.characterId)
    );
    const getLorebookEntriesForAgent = (agentId) => {
      return lorebookEntries.value.filter((e) => e.characterId === agentId);
    };

    const generateUID = () => Date.now() + Math.random();

    function addNewAgent() {
      const newAgent = {
        ...JSON.parse(JSON.stringify(defaultAgent)),
        id: crypto.randomUUID(),
      };
      agentList.value.unshift(newAgent);
      activeAgentId.value = newAgent.id;
    }

    function deleteAgent(agentId) {
      if (agentList.value.length <= 1) {
        alert("至少需要保留一个角色！");
        return;
      }
      const index = agentList.value.findIndex((c) => c.id === agentId);
      if (index > -1) {
        lorebookEntries.value = lorebookEntries.value.filter(
          (e) => e.characterId !== agentId
        );
        agentList.value.splice(index, 1);
        if (activeAgentId.value === agentId) {
          activeAgentId.value = agentList.value[0]?.id || null;
        }
      }
    }

    function importCharacterCard(jsonData) {
      try {
        const data = JSON.parse(jsonData);
        const specData = data.data || data;

        const newAgent = {
          id: crypto.randomUUID(),
          name: specData.name || "导入的角色",
          first_mes: specData.first_mes || "",
        };

        agentList.value.unshift(newAgent);
        activeAgentId.value = newAgent.id;

        if (
          specData.character_book &&
          Array.isArray(specData.character_book.entries)
        ) {
          const importedEntries = specData.character_book.entries.map(
            (entry) => ({
              uid: entry.id ?? generateUID(),
              characterId: newAgent.id,
              keys: entry.keys ?? [],
              comment: entry.comment ?? "",
              content: entry.content ?? "",
              enabled: entry.enabled ?? true,
            })
          );

          if (importedEntries.length > 0) {
            lorebookEntries.value.push(...importedEntries);
          }
        }
        alert(`角色 "${newAgent.name}" 导入成功！`);
      } catch (error) {
        alert(`导入角色卡失败: ${error.message}`);
        console.error(error);
      }
    }

    function addLorebookEntry(agentId = null) {
      const newEntry = {
        ...JSON.parse(JSON.stringify(defaultLorebookEntry)),
        uid: generateUID(),
        characterId: agentId,
      };
      lorebookEntries.value.push(newEntry);
    }

    function deleteLorebookEntry(uid) {
      const index = lorebookEntries.value.findIndex((e) => e.uid === uid);
      if (index > -1) lorebookEntries.value.splice(index, 1);
    }

    function updateLorebookEntriesOrder(newOrder) {
      lorebookEntries.value = newOrder;
    }

    return {
      agentList,
      activeAgentId,
      lorebookEntries,
      activeAgent,
      globalLorebookEntries,
      getLorebookEntriesForAgent,
      addNewAgent,
      deleteAgent,
      importCharacterCard,
      addLorebookEntry,
      deleteLorebookEntry,
      updateLorebookEntriesOrder,
    };
  },
  {
    persist: true,
  }
);
