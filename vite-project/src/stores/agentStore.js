import { defineStore } from "pinia";
import { ref, computed } from "vue";

const defaultAgent = {
  id: null,
  name: "新角色",
  first_mes: "",
};

const defaultWorldbookEntry = {
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
    const worldbookEntries = ref([]);

    const activeAgent = computed(() =>
      agentList.value.find((c) => c.id === activeAgentId.value)
    );
    const globalWorldbookEntries = computed(() =>
      worldbookEntries.value.filter((e) => !e.characterId)
    );
    const getLocalWorldbookEntries = (agentId) => {
      return computed(() =>
        worldbookEntries.value.filter((e) => e.characterId === agentId)
      );
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
        worldbookEntries.value = worldbookEntries.value.filter(
          (e) => e.characterId !== agentId
        );
        agentList.value.splice(index, 1);
        if (activeAgentId.value === agentId) {
          activeAgentId.value = agentList.value[0]?.id || null;
        }
      }
    }

    function addWorldbookEntry(agentId = null) {
      const newEntry = {
        ...JSON.parse(JSON.stringify(defaultWorldbookEntry)),
        uid: generateUID(),
        characterId: agentId,
      };
      worldbookEntries.value.push(newEntry);
    }

    function deleteWorldbookEntry(uid) {
      const index = worldbookEntries.value.findIndex((e) => e.uid === uid);
      if (index > -1) worldbookEntries.value.splice(index, 1);
    }

    function updateWorldbookOrder(newOrder) {
      worldbookEntries.value = newOrder;
    }

    // 最终的、健壮的导入函数
    function importCharacterCard(jsonData) {
      try {
        const data = JSON.parse(jsonData);
        const spec = data.spec === "chara_card_v2" ? data.data : data;
        const worldInfoString = spec.world_info || spec.wi || "";

        const newAgent = {
          id: crypto.randomUUID(),
          name: spec.name || "导入的角色",
          first_mes: spec.first_mes || "",
        };

        let parsedWorldInfoEntries = [];
        if (worldInfoString && typeof worldInfoString === "string") {
          try {
            // 方案 A: 尝试作为标准 JSON 数组解析
            const parsedData = JSON.parse(worldInfoString);
            if (Array.isArray(parsedData)) {
              parsedWorldInfoEntries = parsedData;
            } else {
              throw new Error("世界书数据不是一个数组。");
            }
          } catch (e) {
            // 方案 B: 如果方案 A 失败，则尝试作为 JSON-Lines 格式处理
            try {
              parsedWorldInfoEntries = worldInfoString
                .split("\n")
                .filter(
                  (line) =>
                    line.trim().startsWith("{") && line.trim().endsWith("}")
                )
                .map((line) => JSON.parse(line));
            } catch (e2) {
              console.error("两种方案都无法解析角色卡内嵌的世界书。", e2);
              alert(
                `角色 "${newAgent.name}" 导入成功，但其内嵌的世界书解析失败。`
              );
            }
          }
        }

        const finalEntries = parsedWorldInfoEntries.map((entry) => ({
          ...defaultWorldbookEntry,
          uid: generateUID(),
          characterId: newAgent.id,
          keys: entry.keys ?? [],
          comment: entry.comment ?? "",
          content: entry.content ?? "",
          enabled: entry.enabled ?? true,
        }));

        agentList.value.unshift(newAgent);
        if (finalEntries.length > 0) {
          worldbookEntries.value.push(...finalEntries);
        }

        activeAgentId.value = newAgent.id;
        alert(`角色 "${newAgent.name}" 导入成功！`);
      } catch (error) {
        alert(`导入角色卡失败: ${error.message}`);
        console.error(error);
      }
    }

    return {
      agentList,
      activeAgentId,
      worldbookEntries,
      activeAgent,
      globalWorldbookEntries,
      getLocalWorldbookEntries,
      addNewAgent,
      deleteAgent,
      addWorldbookEntry,
      deleteWorldbookEntry,
      updateWorldbookOrder,
      importCharacterCard,
    };
  },
  {
    persist: true,
  }
);
