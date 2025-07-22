// 正确的相对路径，从 services 返回到 api 目录
import request from "../request.js";

/**
 * 获取 OpenAI 的聊天回复
 * @param {object} params - 请求参数，例如 { messages: [...] }
 * @returns Promise
 */
export const fetchOpenAIChatCompletion = (params) => {
  // 这是OpenAI官方API的路径
  const url = "/v1/chat/completions";

  // 从 localStorage 获取 API Key
  const apiKey = localStorage.getItem("apiKey");
  if (!apiKey) {
    // 如果没有设置API Key，返回一个被拒绝的Promise，这样可以在组件的catch块中捕获到
    return Promise.reject(new Error("API key is not set in localStorage."));
  }

  return request({
    url: url,
    method: "post",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    data: {
      model: "gpt-3.5-turbo", // 你可以根据需要更改模型
      ...params, // 将从组件中传来的 messages 等参数合并进来
    },
  });
};
