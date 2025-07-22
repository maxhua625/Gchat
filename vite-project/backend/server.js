const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post("/api/proxy", async (req, res) => {
  const { baseURL, path, method, apiKey, data } = req.body;

  if (!baseURL || !path || !method || !apiKey) {
    return res.status(400).json({
      error: "Missing required parameters: baseURL, path, method, apiKey",
    });
  }

  const url = `${baseURL}${path}`;

  // --- 主要的改动在这里 ---
  // 1. 创建一个基础的 axios 配置对象
  const axiosConfig = {
    method: method,
    url: url,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  };

  // 2. 只有当请求方法是 'post' (或 put, patch) 时，才添加 data 属性
  if (method.toLowerCase() === "post") {
    axiosConfig.data = data;
  }
  // --- 改动结束 ---

  try {
    // 3. 使用构建好的配置对象发起请求
    const response = await axios(axiosConfig);
    res.json(response.data);
  } catch (error) {
    console.error("Proxy Error:", error.response?.data || error.message);
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend proxy server is running on http://localhost:${PORT}`);
});
