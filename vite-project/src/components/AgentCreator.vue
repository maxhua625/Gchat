<template>
  <div class="agent-creator">
    <el-form label-position="top">
      <el-form-item label="智能体名称">
        <el-input
          v-model="agent.name"
          placeholder="为你的智能体起个名字"
        ></el-input>
      </el-form-item>
      <el-form-item label="角色预设 (System Prompt)">
        <el-input
          type="textarea"
          :rows="6"
          v-model="agent.systemPrompt"
          placeholder="定义 AI 的角色、行为和目标。例如：你是一个乐于助人的 AI 助手。"
        >
        </el-input>
      </el-form-item>
      <el-form-item label="世界书 (World Book)">
        <el-input
          type="textarea"
          :rows="8"
          v-model="agent.worldBook"
          placeholder="提供一些背景知识、上下文信息或专业术语。这部分内容会在需要时附加到对话历史中。"
        >
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSaveAgent"
          >保存智能体</el-button
        >
        <el-button @click="handleClear">清空</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";

const props = defineProps(["initialAgent"]);
const emit = defineEmits(["update-agent"]);

const agent = ref({
  name: "",
  systemPrompt: "",
  worldBook: "",
});

watch(
  () => props.initialAgent,
  (newVal) => {
    if (newVal) {
      agent.value = { ...newVal };
    }
  },
  { immediate: true, deep: true }
);

const handleSaveAgent = () => {
  emit("update-agent", { ...agent.value });
  ElMessage.success("智能体已保存！");
};

const handleClear = () => {
  agent.value = { name: "", systemPrompt: "", worldBook: "" };
  emit("update-agent", { ...agent.value });
  ElMessage.info("已清空当前智能体设定。");
};
</script>
