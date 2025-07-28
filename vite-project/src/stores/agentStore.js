import { defineStore } from "pinia";
import { ref, computed } from "vue";

// 默认的智能体（角色）结构
const defaultAgent = {
  id: null,
  name: "新角色",
  first_mes: "", // 问候语
};

// 默认的世界书条目结构
const defaultWorldbookEntry = {
  uid: null,
  characterId: null, // null 表示全局
  keys: [],
  comment: "新的注释",
  content: "关于关键词的描述...",
  enabled: true,
};

export const useAgentStore = defineStore(
  "agent",
  () => {
    // --- State ---
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
    const worldbookEntries = ref([]); // 存储所有的世界书条目

    // --- Getters ---
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

    // --- Methods ---
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
        // 联动删除该角色的世界书条目
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

    // (关键修复) 强大的、负责所有解析工作的导入函数
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

        // 1. (核心逻辑) 在这里解析 world_info
        let parsedWorldInfoEntries = [];
        if (worldInfoString && typeof worldInfoString === "string") {
          try {
            // 尝试将 SillyTavern 的 JSON-Lines 格式 (每行一个json) 转换为一个有效的 JS 对象数组
            parsedWorldInfoEntries = worldInfoString
              .split("\n")
              .filter((line) => line.trim()) // 过滤掉空行
              .map((line) => {
                const entry = JSON.parse(line);
                return {
                  ...defaultWorldbookEntry, // 确保所有字段都存在
                  uid: generateUID(),
                  characterId: newAgent.id, // (关键) 绑定到新创建的角色
                  keys: entry.keys ?? [],
                  comment: entry.comment ?? "",
                  content: entry.content ?? "",
                  enabled: entry.enabled ?? true,
                };
              });
          } catch (e) {
            console.warn("解析角色卡内嵌的世界书失败，可能格式不兼容。", e);
            alert(
              `角色 "${newAgent.name}" 导入成功，但其内嵌的世界书解析失败。`
            );
          }
        }

        // 2. 将新角色和解析出的世界书条目，一起添加到状态中
        agentList.value.unshift(newAgent);
        if (parsedWorldInfoEntries.length > 0) {
          worldbookEntries.value.push(...parsedWorldInfoEntries);
        }

        // 3. 激活新角色
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
