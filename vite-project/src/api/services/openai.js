import request from "../request.js";

/**
 * 获取 OpenAI 的聊天回复
 * @param {object} params - 包含 messages 和 model 的请求参数
 * @param {string} apiKey - API Key
 * @param {string} baseURL - API 的基础地址
 * @returns Promise
 */
export const fetchOpenAIChatCompletion = (params, apiKey, baseURL) => {
  if (!apiKey || !baseURL) {
    return Promise.reject(new Error("API key or baseURL is not provided."));
  }
  return request({
    baseURL: baseURL, // 动态设置 baseURL
    url: "/v1/chat/completions",
    method: "post",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    data: { model: params.model, messages: params.messages },
  });
};

/**
 * 测试连接并获取 OpenAI 的模型列表
 * @param {string} apiKey - API Key
 * @param {string} baseURL - API 的基础地址
 * @returns Promise
 */
export const fetchOpenAIModels = (apiKey, baseURL) => {
  if (!apiKey || !baseURL) {
    return Promise.reject(new Error("API key or baseURL is not provided."));
  }
  return request({
    baseURL: baseURL, // 动态设置 baseURL
    url: "/v1/models",
    method: "get",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
};
