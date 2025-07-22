import request from "../request.js";

/**
 * 获取 Google Gemini Pro 的聊天回复
 * @param {object} params - 包含 contents 数组的请求参数
 * @param {string} apiKey - API Key
 * @param {string} baseURL - API 的基础地址
 * @returns Promise
 */
export const fetchGeminiCompletion = (params, apiKey, baseURL) => {
  if (!apiKey || !baseURL) {
    return Promise.reject(new Error("API key or baseURL is not provided."));
  }
  const model = "gemini-pro";
  return request({
    baseURL: baseURL, // 动态设置 baseURL
    url: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
    method: "post",
    headers: { "Content-Type": "application/json" },
    data: params,
  });
};

/**
 * 测试连接并获取 Gemini 的模型列表
 * @param {string} apiKey - API Key
 * @param {string} baseURL - API 的基础地址
 * @returns Promise
 */
export const fetchGeminiModels = (apiKey, baseURL) => {
  if (!apiKey || !baseURL) {
    return Promise.reject(new Error("API key or baseURL is not provided."));
  }
  return request({
    baseURL: baseURL, // 动态设置 baseURL
    url: `/v1beta/models?key=${apiKey}`,
    method: "get",
  });
};
