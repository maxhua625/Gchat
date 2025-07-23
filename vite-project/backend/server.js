import express from "express";
import axios from "axios";
import cors from "cors";
import { HttpsProxyAgent } from "https-proxy-agent";

const app = express();
const PORT = 3000;

// =================================================================
// (至关重要) 请在这里配置您的本地 VPN 代理地址和端口
// =================================================================
// 这个地址和端口通常可以在您的 VPN 客户端的设置中找到。
// 常见的端口有 7890, 10809, 1080 等。请根据您的实际情况修改。
// 如果您的代理不需要用户名和密码，请保持 'http://127.0.0.1:7890' 格式。
const proxyUrl = "http://127.0.0.1:7890";
const httpsAgent = new HttpsProxyAgent(proxyUrl);
// =================================================================

app.use(cors());
app.use(express.json());

// 统一的错误处理器
const handleApiError = (res, error, provider) => {
  console.error(`--- ERROR FROM ${provider.toUpperCase()} GATEWAY ---`);
  if (error.response) {
    console.error("Status:", error.response.status);
    console.error("Data:", error.response.data);
    res.status(error.response.status).json(error.response.data);
  } else {
    console.error("Error:", error.message);
    res.status(500).json({
      error: `An internal error occurred in the ${provider} gateway.`,
    });
  }
};

// --- OpenAI 专属路由 ---
const OPENAI_BASE_URL = "https://api.openai.com";
app.post("/api/openai/:endpoint(*)", async (req, res) => {
  const { endpoint } = req.params;
  const { apiKey, data, method = "post" } = req.body;
  if (!apiKey) return res.status(401).json({ error: "API key is required." });

  try {
    const response = await axios({
      url: `${OPENAI_BASE_URL}/${endpoint}`,
      method: method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      data: data,
      httpsAgent: httpsAgent,
      proxy: false, // 必须设置 proxy: false, 才能让 httpsAgent 生效
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(res, error, "openai");
  }
});

// --- DeepSeek 专属路由 ---
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
app.post("/api/deepseek/:endpoint(*)", async (req, res) => {
  const { endpoint } = req.params;
  const { apiKey, data, method = "post" } = req.body;
  if (!apiKey) return res.status(401).json({ error: "API key is required." });

  try {
    const response = await axios({
      url: `${DEEPSEEK_BASE_URL}/${endpoint}`,
      method: method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      data: data,
      httpsAgent: httpsAgent,
      proxy: false,
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(res, error, "deepseek");
  }
});

// --- Gemini 专属路由 ---
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com";

// (关键) 为“测试连接”(获取模型列表)创建一个专属的、硬编码的路由
app.post("/api/gemini/get-models", async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(401).json({ error: "API key is required." });

  try {
    const url = `${GEMINI_BASE_URL}/v1beta/models?key=${apiKey}`;
    const response = await axios.get(url, {
      httpsAgent: httpsAgent,
      proxy: false,
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(res, error, "gemini-models");
  }
});

// 为“发送聊天”保留原来的通用路由
app.post("/api/gemini/:endpoint(*)", async (req, res) => {
  const { endpoint } = req.params;
  const { apiKey, data, method = "post" } = req.body;
  if (!apiKey) return res.status(401).json({ error: "API key is required." });

  try {
    const response = await axios({
      url: `${GEMINI_BASE_URL}/${endpoint}?key=${apiKey}`,
      method: method,
      headers: { "Content-Type": "application/json" },
      data: data,
      httpsAgent: httpsAgent,
      proxy: false,
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(res, error, "gemini-chat");
  }
});

// --- 自定义 API 路由 (保持不变) ---
app.post("/api/custom", async (req, res) => {
  const { url, apiKey, data, method = "post" } = req.body;
  if (!url) return res.status(400).json({ error: "Target URL is required." });
  if (!apiKey) return res.status(401).json({ error: "API key is required." });

  try {
    const response = await axios({
      url: url,
      method: method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      data: data,
      httpsAgent: httpsAgent,
      proxy: false,
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(res, error, "custom");
  }
});

app.listen(PORT, () => {
  console.log(`Backend API Gateway listening on port ${PORT}`);
  console.log(`Using proxy: ${proxyUrl}`);
});
