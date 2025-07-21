<template>
  <div class="api-settings">
    <el-form label-position="top">
      <el-form-item label="API 地址">
        <el-input
          v-model="internalApiUrl"
          placeholder="例如: http://localhost:5000/v1"
        ></el-input>
      </el-form-item>
      <el-form-item label="API 密钥 (可选)">
        <el-input
          v-model="internalApiKey"
          type="password"
          show-password
          placeholder="如果后端需要，请填入"
        ></el-input>
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          @click="handleTestConnection"
          :loading="testing"
          >测试连接</el-button
        >
        <el-button @click="handleSave" type="success">保存配置</el-button>
      </el-form-item>
      <el-form-item v-if="models.length > 0" label="选择模型">
        <el-select
          v-model="internalSelectedModel"
          placeholder="请选择模型"
          style="width: 100%"
        >
          <el-option
            v-for="model in models"
            :key="model"
            :label="model"
            :value="model"
          ></el-option>
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { testApiConnection } from "../api/chat";
import { ElMessage } from "element-plus";

const props = defineProps(["apiUrl", "apiKey", "selectedModel"]);
const emit = defineEmits([
  "update:apiUrl",
  "update:apiKey",
  "update:selectedModel",
]);

const internalApiUrl = ref("");
const internalApiKey = ref("");
const internalSelectedModel = ref("");
const testing = ref(false);
const models = ref([]);

onMounted(() => {
  internalApiUrl.value = props.apiUrl || "";
  internalApiKey.value = props.apiKey || "";
  internalSelectedModel.value = props.selectedModel || "";
});

watch(internalApiUrl, (newVal) => emit("update:apiUrl", newVal));
watch(internalApiKey, (newVal) => emit("update:apiKey", newVal));
watch(internalSelectedModel, (newVal) => emit("update:selectedModel", newVal));

const handleTestConnection = async () => {
  if (!internalApiUrl.value) {
    ElMessage.warning("请输入 API 地址");
    return;
  }
  testing.value = true;
  models.value = [];
  const fetchedModels = await testApiConnection(
    internalApiUrl.value,
    internalApiKey.value
  );
  if (fetchedModels.length > 0) {
    models.value = fetchedModels;
    if (
      !internalSelectedModel.value ||
      !fetchedModels.includes(internalSelectedModel.value)
    ) {
      internalSelectedModel.value = fetchedModels[0];
    }
  }
  testing.value = false;
};

const handleSave = () => {
  localStorage.setItem("api_url", internalApiUrl.value);
  localStorage.setItem("api_key", internalApiKey.value);
  localStorage.setItem("selected_model", internalSelectedModel.value);
  ElMessage.success("配置已保存！");
};
</script>
