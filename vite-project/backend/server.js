import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
const PORT = 3000;

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

// --- OpenAI 路由 (保持不变) ---
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
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(res, error, "openai");
  }
});

// --- Gemini 路由 (保持不变) ---
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com";
app.post("/api/gemini/get-models", async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(401).json({ error: "API key is required." });
  try {
    const url = `${GEMINI_BASE_URL}/v1beta/models?key=${apiKey}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    handleApiError(res, error, "gemini-models");
  }
});
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
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(res, error, "gemini-chat");
  }
});

// --- (关键新增) DeepSeek 专属路由 ---
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
app.post("/api/deepseek/:endpoint(*)", async (req, res) => {
  const { endpoint } = req.params;
  const { apiKey, data, method = "post" } = req.body;
  if (!apiKey) return res.status(401).json({ error: "API key is required." });
  try {
    // DeepSeek 的认证方式和 OpenAI 完全相同
    const response = await axios({
      url: `${DEEPSEEK_BASE_URL}/${endpoint}`,
      method: method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      data: data,
    });
    res.json(response.data);
  } catch (error) {
    handleApiError(res, error, "deepseek");
  }
});

app.listen(PORT, () => {
  console.log(`Backend API Gateway listening on port ${PORT}`);
});
