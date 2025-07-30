<template>
  <div class="page-layout">
    <main class="editor-content">
      <div class="editor-header">
        <h3 class="page-title">个人设定</h3>
        <p class="page-description">
          在这里定义您作为“User”的身份。此处的设定将被注入到聊天上下文中，影响
          AI 对您的认知。
        </p>
      </div>

      <section class="editor-section">
        <div class="form-group">
          <label for="user-name">你的名字 (用于替换 {{ user }})</label>
          <input
            id="user-name"
            type="text"
            v-model="userStore.persona.name"
            class="form-input"
            placeholder="例如：探险家、阿明、旅行者..."
          />
        </div>
        <div class="form-group">
          <label for="user-description"
            >你的背景设定 (Persona Description)</label
          >
          <textarea
            id="user-description"
            v-model="userStore.persona.description"
            class="form-textarea"
            placeholder="描述你的身份、性格、目标，或者任何想让 AI 知道的关于你的信息..."
          ></textarea>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { useUserStore } from "@/stores/userStore";

const userStore = useUserStore();
</script>

<style scoped>
.page-layout {
  display: flex;
  justify-content: center;
  padding: 2rem;
  background-color: #f0f2f5;
}
.editor-content {
  width: 100%;
  max-width: 800px;
  background: #fff;
  padding: 2rem 3rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}
.editor-header {
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
}
.page-title {
  font-size: 1.8rem;
  font-weight: bold;
  margin-top: 0;
  margin-bottom: 0.5rem;
}
.page-description {
  color: #6c757d;
  font-size: 1rem;
}
.editor-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.form-group {
  display: flex;
  flex-direction: column;
}
.form-group label {
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #333;
}
.form-input,
.form-textarea {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
}
.form-textarea {
  min-height: 200px;
  resize: vertical;
}
</style>
