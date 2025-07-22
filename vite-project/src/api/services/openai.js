import { proxyRequest } from "../apiService.js";

/**
 * 获取 OpenAI 的聊天回复 (通过我们的后端代理)
 */
export const fetchOpenAIChatCompletion = (params, apiKey, baseURL) => {
  // 正确的拼接方式：baseURL + 具体的 API 路径
  const targetURL = `${baseURL}/v1/chat/completions`;
  const targetHeaders = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  const targetData = {
    model: params.model,
    messages: params.messages,
  };
  return proxyRequest(targetURL, "post", targetHeaders, targetData);
};

/**
 * 测试连接并获取 OpenAI 的模型列表 (通过我们的后端代理)
 */
export const fetchOpenAIModels = (apiKey, baseURL) => {
  // 关键修正：确保只拼接一次 API 路径
  const targetURL = `${baseURL}/v1/models`;
  const targetHeaders = {
    Authorization: `Bearer ${apiKey}`,
  };
  return proxyRequest(targetURL, "get", targetHeaders, null);
};
