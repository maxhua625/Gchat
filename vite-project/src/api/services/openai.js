import request from "../request.js";

/**
 * 获取 OpenAI 的聊天回复
 * @param {object} params - 包含 messages 和 model 的请求参数
 * @param {string} apiKey - 从设置中传入的 API Key
 * @returns Promise
 */
export const fetchOpenAIChatCompletion = (params, apiKey) => {
  // 检查 apiKey 是否被传入
  if (!apiKey) {
    return Promise.reject(new Error("OpenAI API key is not provided."));
  }

  return request({
    url: "/v1/chat/completions",
    method: "post",
    headers: {
      // 使用传入的 apiKey
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    data: {
      model: params.model,
      messages: params.messages,
      stream: false, // 如果需要流式输出，可以改为 true
    },
  });
};

/**
 * (新增) 测试连接并获取 OpenAI 的模型列表
 * @param {string} apiKey - 从设置页面输入的 API Key
 * @returns Promise
 */
export const fetchOpenAIModels = (apiKey) => {
  // 检查 apiKey 是否被传入
  if (!apiKey) {
    return Promise.reject(new Error("OpenAI API key is not provided."));
  }

  return request({
    url: "/v1/models",
    method: "get",
    headers: {
      // 使用传入的 apiKey
      Authorization: `Bearer ${apiKey}`,
    },
  });
};
