<!-- src/views/SettingsView.vue -->
<template>
  <div class="settings-view">
    <h2>应用设置</h2>

    <!-- 新增：文件操作按钮 -->
    <div class="file-operations">
      <el-button type="primary" @click="handleExport">导出配置到文件</el-button>
      <el-button type="success" @click="triggerFileInput"
        >从文件导入配置</el-button
      >
      <!-- 隐藏的文件输入框，通过按钮触发 -->
      <input
        type="file"
        ref="fileInput"
        @change="handleImport"
        style="display: none"
        accept=".json"
      />
    </div>

    <el-collapse v-model="activePanels">
      <el-collapse-item title="1. API & 模型设置" name="1">
        <ApiSettings
          v-model:apiUrl="store.apiConfig.url"
          v-model:apiKey="store.apiConfig.key"
          v-model:selectedModel="store.apiConfig.model"
        />
      </el-collapse-item>
      <el-collapse-item title="2. 智能体设置" name="2">
        <AgentCreator
          :initial-agent="store.agent"
          @update-agent="handleUpdateAgent"
        />
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";
import ApiSettings from "../components/ApiSettings.vue";
import AgentCreator from "../components/AgentCreator.vue";
import { store } from "../store"; // 导入我们的全局状态

const activePanels = ref(["1", "2"]);
const fileInput = ref(null); // 创建一个 ref 来引用隐藏的 input 元素

const handleUpdateAgent = (updatedAgent) => {
  store.agent = updatedAgent;
  localStorage.setItem("agent", JSON.stringify(updatedAgent));
};

// --- 新增：导出逻辑 ---
const handleExport = () => {
  // 1. 准备要保存的数据
  const settingsToSave = {
    apiConfig: store.apiConfig,
    agent: store.agent,
  };

  // 2. 将数据对象转换为格式化的 JSON 字符串
  const dataStr = JSON.stringify(settingsToSave, null, 2); // null, 2 用于美化输出

  // 3. 创建一个 Blob 对象，它代表了我们的文件内容
  const blob = new Blob([dataStr], { type: "application/json" });

  // 4. 创建一个临时的 URL 指向这个 Blob 对象
  const url = URL.createObjectURL(blob);

  // 5. 创建一个隐藏的 <a> 标签来触发下载
  const link = document.createElement("a");
  link.href = url;
  link.download = "ai-chat-settings.json"; // 设置默认下载的文件名
  document.body.appendChild(link);
  link.click(); // 模拟点击链接

  // 6. 清理：移除 <a> 标签并释放 URL 对象
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  ElMessage.success("配置已开始下载！");
};

// --- 新增：导入逻辑 ---
const triggerFileInput = () => {
  // 模拟点击隐藏的文件输入框
  fileInput.value.click();
};

const handleImport = (event) => {
  const file = event.target.files[0];
  if (!file) {
    return; // 用户取消了选择
  }

  // 使用 FileReader API 来读取文件内容
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const content = e.target.result;
      const importedSettings = JSON.parse(content);

      // 简单的验证，确保文件包含我们需要的数据
      if (importedSettings.apiConfig && importedSettings.agent) {
        // **非常重要的一步**：将导入的数据更新到应用中

        // 1. 更新全局 store
        store.apiConfig = importedSettings.apiConfig;
        store.agent = importedSettings.agent;

        // 2. 同时也要更新 localStorage，以便刷新后保留
        localStorage.setItem("api_url", store.apiConfig.url);
        localStorage.setItem("api_key", store.apiConfig.key);
        localStorage.setItem("selected_model", store.apiConfig.model);
        localStorage.setItem("agent", JSON.stringify(store.agent));

        ElMessage.success("配置已成功导入并应用！");
      } else {
        ElMessage.error("导入失败：文件格式不正确。");
      }
    } catch (error) {
      console.error("导入文件时出错:", error);
      ElMessage.error("导入失败：文件不是有效的 JSON 格式。");
    }
  };

  reader.onerror = () => {
    ElMessage.error("读取文件时发生错误。");
  };

  // 以文本形式读取文件
  reader.readAsText(file);

  // 清空 input 的值，这样下次选择同一个文件时也能触发 change 事件
  event.target.value = "";
};
</script>

<style scoped>
.settings-view {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}
/* 新增样式 */
.file-operations {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #dcdfe6;
}
</style>
