<template>
  <div class="app-wrapper">
    <header>
      <nav>
        <RouterLink to="/">聊天</RouterLink>
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
  /* 确保 main 区域可以滚动，而不是整个页面 */
  overflow-y: auto;
}
</style>
