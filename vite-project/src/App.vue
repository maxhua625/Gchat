<template>
  <div class="app-wrapper">
    <header>
      <nav>
        <RouterLink to="/">聊天</RouterLink>
        <RouterLink to="/characters">角色与世界</RouterLink>
        <!-- 修改了名称 -->
        <RouterLink to="/presets">预设</RouterLink>
        <RouterLink to="/settings">设置</RouterLink>
      </nav>
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from "vue-router";
</script>

<style scoped>
/* 样式保持不变 */
.app-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
header {
  background: #2c3e50;
  padding: 1rem;
  flex-shrink: 0;
}
nav {
  display: flex;
  justify-content: center;
  gap: 2rem;
}
nav a {
  font-weight: bold;
  color: #fff;
  text-decoration: none;
  font-size: 1.2rem;
}
nav a.router-link-exact-active {
  color: #42b983;
}
main {
  flex-grow: 1;
  overflow-y: auto;
  background-color: #f0f2f5;
}
</style>
