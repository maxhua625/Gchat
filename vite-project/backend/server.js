import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
const PORT = 3000;

// API 提供商的根地址“地图”
const PROVIDER_BASE_URLS = {
  openai: "https://api.openai.com",
  gemini: "https://generativelanguage.googleapis.com",
};

app.use(cors());
app.use(express.json());

app.post("/api/forward", async (req, res) => {
  // 我们使用一个更清晰的端点名
  // 从前端接收更简单的指令
  const { provider, endpoint, method, apiKey, data } = req.body;

  if (!provider || !PROVIDER_BASE_URLS[provider]) {
    return res
      .status(400)
      .json({ error: "A valid provider (openai/gemini) is required" });
  }
  if (!endpoint) {
    return res.status(400).json({ error: "Target endpoint is required" });
  }

  // 后端在这里构建最终的、绝对正确的 URL
  const baseURL = PROVIDER_BASE_URLS[provider];
  const finalURL = baseURL + endpoint;

  const requestMethod = method?.toUpperCase() || "GET";
  console.log(`Forwarding request to: ${requestMethod} ${finalURL}`);

  try {
    const headers = {};
    // 根据提供商设置不同的认证头
    if (provider === "openai") {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    headers["Content-Type"] = "application/json";

    const axiosConfig = {
      url: finalURL,
      method: requestMethod,
      headers: headers,
    };

    if (requestMethod !== "GET" && data) {
      axiosConfig.data = data;
    }

    const response = await axios(axiosConfig);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("--- FORWARDING ERROR ---");
    console.error("Request to:", finalURL);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
    console.error("--- END FORWARDING ERROR ---");

    const status = error.response?.status || 500;
    const errorData = error.response?.data || {
      error: "An error occurred in the forwarding server.",
    };
    res.status(status).json(errorData);
  }
});

app.listen(PORT, () => {
  console.log(`Backend forwarding server listening on port ${PORT}`);
});
