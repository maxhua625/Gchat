import request from "../request.js";

/**
 * 获取 Google Gemini Pro 的聊天回复
 * @param {object} params - 包含 contents 数组的请求参数
 * @param {string} apiKey - 从设置中传入的 API Key
 * @returns Promise
 */
export const fetchGeminiCompletion = (params, apiKey) => {
  // 检查 apiKey 是否被传入
  if (!apiKey) {
    return Promise.reject(new Error("Gemini API key is not provided."));
  }

  // Gemini API 的地址和模型，将 apiKey 作为 URL 参数
  const model = "gemini-pro"; // 对于聊天，通常使用 gemini-pro
  const url = `/v1beta/models/${model}:generateContent?key=${apiKey}`;

  return request({
    url: url,
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    // Gemini 的请求体直接就是要发送的数据
    data: params,
  });
};

/**
 * (新增) 测试连接并获取 Gemini 的模型列表
 * @param {string} apiKey - 从设置页面输入的 API Key
 * @returns Promise
 */
export const fetchGeminiModels = (apiKey) => {
  // 检查 apiKey 是否被传入
  if (!apiKey) {
    return Promise.reject(new Error("Gemini API key is not provided."));
  }

  return request({
    // 将 apiKey 作为 URL 参数
    url: `/v1beta/models?key=${apiKey}`,
    method: "get",
  });
};
