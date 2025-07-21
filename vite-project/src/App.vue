<template>
  <div id="app-layout">
    <el-container style="height: 100vh">
      <!-- 左侧导航栏 -->
      <el-aside width="200px" class="nav-aside">
        <h1 class="title">AI Chat</h1>
        <el-menu :default-active="activeRoute" class="nav-menu" router>
          <el-menu-item index="/chat">
            <span>聊天</span>
          </el-menu-item>
          <el-menu-item index="/settings">
            <span>设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 右侧主内容区 -->
      <el-main class="content-main">
        <!-- 路由匹配到的组件将在这里渲染 -->
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
// 导入并执行我们的全局状态加载函数
import { useInitialLoad } from "./store";

useInitialLoad();

// 计算当前激活的路由路径，用于高亮菜单项
const route = useRoute();
// 已修复：使用可选链和后备值，防止初始化时出错
const activeRoute = computed(() => route?.path || "/");
</script>

<style>
/* 全局样式可以放在这里 */
body {
  margin: 0;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB",
    "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
}
</style>

<style scoped>
.nav-aside {
  background-color: #f4f6f8;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.title {
  text-align: center;
  margin: 20px 0;
  color: #303133;
}

.nav-menu {
  border-right: none; /* 移除 el-menu 默认的右边框 */
}

.content-main {
  padding: 0;
  height: 100vh;
  overflow: hidden; /* 防止出现双重滚动条 */
}
</style>
