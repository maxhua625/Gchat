# Gchat: 您的个人 AI 聊天与世界构建平台

欢迎来到 Gchat！这不仅仅是一个简单的聊天应用，更是一个强大、可高度定制的、支持多角色的 AI 对话与创作平台。Gchat 旨在为您提供一个私密的、可完全掌控的、能够与您亲手创建或导入的 AI 角色进行深度互动的空间。

本项目采用现代化的技术栈构建，前端使用 **Vite + Vue 3** 带来极速的开发体验和流畅的响应式界面，状态管理由官方推荐的 **Pinia** 负责，确保了数据的持久化和组件间的顺畅通信。后端则由 **Node.js + Express** 构建了一个强大而灵活的 API 网关，负责安全地处理所有与外部 AI 服务的通信。

## 核心功能

- **多 API 支持**: 内置设置页面，可轻松配置和切换 OpenAI, Google Gemini, DeepSeek, 以及任何兼容 OpenAI 格式的自定义 API 服务。
- **安全的后端代理**: 所有 API 请求均通过自建的 Node.js 后端转发，完美解决浏览器跨域（CORS）问题，并确保您的 API 密钥永远不会暴露在前端。
- **持久化状态管理**: 所有设置、角色、世界书、预设和聊天记录都通过 Pinia 自动保存在您的浏览器本地存储中，刷新页面不会丢失任何数据。
- **专业的角色系统**:
  - 独立的“角色与世界”管理页面。
  - 支持创建、编辑和删除多个角色。
  - **支持一键导入 SillyTavern 角色卡**（`.json` 和 `.png` 格式），自动解析角色信息。
- **强大的世界书 (World Info)**:
  - 支持**全局世界书**（对所有角色生效）和**角色专属世界书**。
  - 支持拖拽排序、增删改查。
  - 能够智能导入和解析 SillyTavern 角色卡内嵌的世界书数据。
- **高级预设 (Presets)**:
  - 独立的预设管理页面，支持导入和编辑复杂的预设 JSON 文件。
  - 可精细调整数十种模型参数（如 `temperature`, `top_p` 等）。
  - 支持复杂的**提示词注入 (Prompt Injection)**，并可通过拖拽调整注入顺序。
- **交互式聊天界面**:
  - 为每个角色保留独立的聊天历史。
  - 支持新建/切换/删除聊天会话。
  - 支持**编辑**任意一条消息。
  - 支持**重新生成** AI 的回复。
  - 支持**删除指定**的一条或多条消息。

## 项目结构

```
Gchat/
├── backend/                  # 后端服务目录
│   ├── node_modules/
│   ├── package-lock.json
│   ├── package.json          # 后端依赖和配置
│   └── server.js             # 后端 Express 服务器核心文件
├── node_modules/
├── src/                      # 前端核心源码目录
│   ├── api/                  # API 请求封装目录
│   │   ├── services/         # 各个 API 提供商的具体实现
│   │   │   ├── custom.js
│   │   │   ├── deepseek.js
│   │   │   ├── gemini.js
│   │   │   └── openai.js
│   │   ├── index.js          # API 统一出口
│   │   └── request.js        # Axios 核心请求实例
│   ├── assets/               # 静态资源 (CSS, 图片等)
│   ├── components/
│   │   └── Message.vue       # 聊天消息组件
│   ├── router/
│   │   └── index.js          # Vue Router 路由配置
│   ├── stores/               # Pinia 状态管理目录
│   │   ├── agentStore.js     # 智能体数据中心
│   │   ├── chatStore.js      # 聊天数据中心
│   │   ├── index.js          #
│   │   ├── presetsStore.js   # 预设数据中心
│   ├── views/                # 页面级组件
│   │   ├── AgentManagerView.vue # 智能体管理页面
│   │   ├── ChatView.vue      # 聊天主页面
│   │   ├── PresetsView.vue   # 预设管理页面
│   │   └── SettingsView.vue  # API 设置页面
│   ├── App.vue               # Vue 应用根组件
│   └── main.js               # Vue 应用入口文件
├── .gitignore
├── index.html                # HTML 入口文件
├── package.json              # 前端依赖和脚本
└── vite.config.js            # Vite 配置文件
```

## 文件详解

### 后端 (`backend/`)

#### `server.js`

- **作用**: 这是整个 Gchat 应用的**心脏和大脑**，一个基于 Node.js 和 Express 的 API 网关。
- **功能**:
  1.  **接收前端请求**: 它会监听来自前端的所有 API 请求（例如，`/api/openai/...`）。
  2.  **安全处理**: 它从请求中提取出 API 密钥和需要发送的数据。这是至关重要的一步，因为它确保了您的 API 密钥永远不会离开您的服务器，不会暴露在浏览器中。
  3.  **转发到外部**: 它根据请求的类型（OpenAI, Gemini 等），将请求**转发**到真正的、官方的 AI 服务器地址。
  4.  **处理网络代理**: 内置了 `https-proxy-agent`，可以配置您本地的 VPN 代理，解决了在特殊网络环境下 Node.js 无法直接访问外部 API 的问题。
  5.  **返回结果**: 接收到外部 AI 服务器的响应后，再将其原封不动地返回给前端。

#### `package.json` (后端)

- **作用**: 后端的配置文件。
- **功能**:
  1.  **定义依赖**: 列出了后端服务需要的所有库 (`express`, `axios`, `cors` 等)。
  2.  **设置模块类型**: 通过 `"type": "module"`，告诉 Node.js 使用现代的 `import/export` 语法。
  3.  **定义脚本**: 包含了 `npm start` 命令，方便您启动后端服务。

---

### 前端 (`src/`)

#### `main.js`

- **作用**: 前端 Vue 应用的**启动入口**。
- **功能**:
  1.  创建 Vue 应用实例。
  2.  初始化并注册 **Pinia** (用于状态管理) 和 **Vue Router** (用于页面导航)。

#### `App.vue`

- **作用**: **应用根组件**，所有页面视图的容器。
- **功能**:
  1.  定义了应用的整体布局，主要是顶部的**导航栏** (`<nav>`)。
  2.  提供了一个 `<RouterView />` 组件，这是所有页面 (`ChatView`, `SettingsView` 等) 将被渲染的地方。

---

### API 请求层 (`src/api/`)

#### `request.js`

- **作用**: **统一的 Axios 请求实例**。
- **功能**:
  1.  创建并配置一个 `axios` 实例。
  2.  设置了 `baseURL` 为 `http://localhost:3000`，这意味着前端的所有 API 请求**只会**发往我们自己的后端服务器，而不会直接请求外部。
  3.  包含了响应拦截器，用于统一处理和打印来自后端的错误信息。

#### `services/*.js` (例如 `openai.js`, `gemini.js`)

- **作用**: **各个 API 提供商的具体实现**。
- **功能**: 每一个文件都封装了针对特定 AI 服务商的函数。例如，`openai.js` 包含 `fetchOpenAIChatCompletion` (发送聊天) 和 `fetchOpenAIModels` (测试连接/获取模型) 两个函数。这些函数负责将前端的数据打包成后端需要的格式，然后通过 `request.js` 发送给后端对应的路由（例如 `/api/openai/v1/chat/completions`）。

#### `index.js` (在 `api/` 目录下)

- **作用**: **API 服务的统一出口**。
- **功能**: 将 `services/` 目录下的所有 API 函数导入，并重新导出一个统一的 `api` 对象。这使得我们在其他组件中可以方便地通过 `api.openai.someFunction()` 或 `api.gemini.someFunction()` 来调用。

---

### 状态管理层 (`src/stores/`)

这是应用的数据中心，负责存储和管理所有持久化的数据。

#### `characterStore.js`

- **作用**: **智能体数据管理中心**。
- **功能**: 存储 `characterList` (所有角色的列表) 和 `activeCharacterId` (当前选中的角色)。提供了新建、删除、切换角色以及**从 SillyTavern 角色卡 (`.json` 或 `.png`) 导入角色**的强大功能。

#### `presetsStore.js`

- **作用**: **预设数据管理中心**。
- **功能**: 存储 `presetsList` 和 `activePresetIndex`。负责管理所有与模型参数、提示词注入相关的复杂设置。

#### `chatStore.js`

- **作用**: **聊天数据管理中心**。
- **功能**: 它的核心是 `chats` 数组，其中每个对象都代表一个独立的聊天会话，并与一个 `characterId` 绑定。它提供了开始新聊天、切换聊天、删除聊天、添加消息、编辑消息、重新生成等所有与聊天记录本身相关的操作。

---

### 视图层 (`src/views/` 和 `src/components/`)

#### `components/Message.vue`

- **作用**: **单条聊天消息组件**。
- **功能**: 负责渲染一条消息的所有视觉元素，包括楼层号、头像、消息气泡、Markdown 内容解析、编辑功能（铅笔图标和输入框）、重新生成按钮，以及按需显示的复选框。它也是实现用户消息居右、AI 消息居左的关键。

#### `views/AgentManagerView.vue`

- **作用**: **统一的“智能体”管理页面**。
- **功能**: 这是项目中最复杂、最强大的管理界面。它集成了角色列表管理（新建、导入、删除、重命名）和世界书管理（标签页切换、表格编辑、拖拽排序），是您创建和定义 AI 灵魂的核心场所。

#### `views/PresetsView.vue`

- **作用**: **预设管理页面**。
- **功能**: 提供了一个强大的界面，用于管理模型参数和复杂的提示词注入规则。

#### `views/SettingsView.vue`

- **作用**: **应用设置页面**。
- **功能**: 负责管理与外部 API 服务的连接，允许用户输入和测试不同提供商的 API 密钥，并选择默认使用的模型。

#### `views/ChatView.vue`

- **作用**: **聊天主界面**。
- **功能**: 这是用户与 AI 交互的核心。它整合了来自所有 Store 的数据：
  1.  从 `characterStore` 获取当前角色。
  2.  从 `chatStore` 获取并显示该角色的聊天记录。
  3.  在发送消息时，调用 `buildFinalMessages` 函数，该函数会从 `characterStore`, `worldbookStore`, `presetsStore`, 和 `chatStore` 中提取所有相关信息（角色设定、世界书、预设、历史记录），构建一个最终的、完整的上下文。
  4.  调用 `api` 服务将这个上下文发送给后端。
  5.  提供了聊天管理菜单，用于新建/切换/删除聊天、重新生成和删除消息。

## 如何运行项目

### 1. 准备工作

- 确保您已安装 [Node.js](https://nodejs.org/) (推荐 v18 或更高版本)。
- 准备好您的 API 密钥 (OpenAI, Gemini 等)。
- 如果您在需要代理的网络环境下，请准备好您的本地 HTTP 代理地址和端口 (例如 `http://127.0.0.1:7890`)。

### 2. 启动后端

```bash
# 1. 进入后端目录
cd backend

# 2. 安装依赖 (首次运行时需要)
npm install

# 3. (重要) 如果需要代理，请修改 server.js 文件
#    找到 const proxyUrl = '...' 这一行，填入您自己的代理地址

# 4. 启动后端服务器
npm start
```

您应该会看到 `Backend API Gateway listening on port 3000`。

### 3. 启动前端

```bash
# 1. (在另一个终端中) 回到项目根目录
cd ..

# 2. 安装依赖 (首次运行时需要)
npm install

# 3. 启动 Vite 开发服务器
npm run dev
```

您应该会看到 Gchat 正在 `http://localhost:5173` (或类似地址) 上运行。现在，您可以在浏览器中打开它了！
