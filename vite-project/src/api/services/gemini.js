import { proxyRequest } from "../apiService.js";

/**
 * 获取 Google Gemini Pro 的聊天回复 (通过我们的后端代理)
 */
export const fetchGeminiCompletion = (params, apiKey, baseURL) => {
  const model = "gemini-pro";
  // 正确的拼接方式：baseURL + 具体的 API 路径
  const targetURL = `${baseURL}/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const targetHeaders = { "Content-Type": "application/json" };
  return proxyRequest(targetURL, "post", targetHeaders, params);
};

/**
 * 测试连接并获取 Gemini 的模型列表 (通过我们的后端代理)
 */
export const fetchGeminiModels = (apiKey, baseURL) => {
  // 关键修正：确保只拼接一次 API 路径
  const targetURL = `${baseURL}/v1beta/models?key=${apiKey}`;
  return proxyRequest(targetURL, "get", {}, null);
};
