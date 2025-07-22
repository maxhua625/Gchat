const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post("/api/proxy", async (req, res) => {
  const { baseURL, path, method, apiKey, data } = req.body;

  if (!baseURL || !path || !method) {
    // apiKey 不再是必须的，因为gemini的apiKey在path里
    return res
      .status(400)
      .json({ error: "Missing required parameters: baseURL, path, method" });
  }

  const url = `${baseURL}${path}`;

  // --- 主要的改动在这里 ---
  const headers = {
    "Content-Type": "application/json",
  };

  // 只有当 apiKey 存在且不为空时，才添加 Authorization 头
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const axiosConfig = {
    method: method,
    url: url,
    headers: headers,
  };

  if (method.toLowerCase() === "post") {
    axiosConfig.data = data;
  }
  // --- 改动结束 ---

  try {
    const response = await axios(axiosConfig);
    res.json(response.data);
  } catch (error) {
    // 增强日志记录，打印出完整的错误对象
    console.error("--- PROXY ERROR ---");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Headers:", error.response.headers);
      console.error("Data:", error.response.data);
    } else if (error.request) {
      console.error("Request made but no response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    console.error("Original Axios Config:", error.config);
    console.error("--- END PROXY ERROR ---");

    res.status(error.response?.status || 500).json(
      error.response?.data || {
        error: "An unknown error occurred in the proxy.",
      }
    );
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend proxy server is running on http://localhost:${PORT}`);
});
