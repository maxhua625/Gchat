import { defineStore } from "pinia";
import { ref, computed } from "vue";
// 1. 导入世界书 store
import { useWorldbookStore } from "./worldbookStore";

const defaultCharacter = {
  /* ... 保持不变 ... */
};

export const useCharacterStore = defineStore(
  "character",
  () => {
    const characterList = ref([
      {
        ...JSON.parse(JSON.stringify(defaultCharacter)),
        id: crypto.randomUUID(),
        name: "默认助手",
        first_mes: "你好，我是你的默认助手！",
      },
    ]);
    const activeCharacterId = ref(
      characterList.value.length > 0 ? characterList.value[0].id : null
    );

    const activeCharacter = computed(() =>
      characterList.value.find((c) => c.id === activeCharacterId.value)
    );

    function addNewCharacter() {
      const newChar = {
        ...JSON.parse(JSON.stringify(defaultCharacter)),
        id: crypto.randomUUID(),
      };
      characterList.value.unshift(newChar);
      activeCharacterId.value = newChar.id;
    }

    // (关键修改) 删除角色时，联动删除其世界书
    function deleteCharacter(characterId) {
      if (characterList.value.length <= 1) {
        alert("至少需要保留一个角色！");
        return;
      }
      const index = characterList.value.findIndex((c) => c.id === characterId);
      if (index > -1) {
        // 联动删除
        const worldbookStore = useWorldbookStore();
        worldbookStore.deleteEntriesForCharacter(characterId);

        characterList.value.splice(index, 1);
        if (activeCharacterId.value === characterId) {
          activeCharacterId.value = characterList.value[0]?.id || null;
        }
      }
    }

    // (关键修改) 导入角色卡时，联动导入其世界书
    function importCharacterCard(jsonData) {
      try {
        const data = JSON.parse(jsonData);
        const spec = data.spec === "chara_card_v2" ? data.data : data;
        const worldInfo = spec.world_info || spec.wi || "";

        const newChar = {
          id: crypto.randomUUID(),
          name: spec.name || "导入的角色",
          description: spec.description || "",
          personality: spec.personality || "",
          scenario: spec.scenario || "",
          first_mes: spec.first_mes || "",
          mes_example: spec.mes_example || "",
          // 不再直接存储 world_info，因为它将被导入到 worldbookStore
        };

        characterList.value.unshift(newChar);
        activeCharacterId.value = newChar.id;

        // 联动导入
        if (worldInfo) {
          const worldbookStore = useWorldbookStore();
          // SillyTavern 的 world_info 是一个 JSON 字符串，我们需要解析它
          // 我们假设它是旧的数组格式
          try {
            const worldInfoEntries = JSON.parse(
              `[${worldInfo.split("\n").filter(Boolean).join(",")}]`
            );
            worldbookStore.importWorldbook(
              JSON.stringify(worldInfoEntries),
              newChar.id
            );
          } catch (e) {
            console.warn("解析角色卡内嵌的世界书失败，可能格式不兼容。", e);
          }
        }

        alert(`角色 "${newChar.name}" 导入成功！`);
      } catch (error) {
        alert(`导入角色卡失败: ${error.message}`);
        console.error(error);
      }
    }

    return {
      characterList,
      activeCharacterId,
      activeCharacter,
      addNewCharacter,
      deleteCharacter,
      importCharacterCard,
    };
  },
  {
    persist: true,
  }
);
