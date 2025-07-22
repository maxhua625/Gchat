import request from "../request.js";

/**
 * 获取 Google Gemini Pro 的聊天回复
 * @param {object} params - 包含 contents 数组的请求参数
 * @returns Promise
 */
export const fetchGeminiCompletion = (params) => {
  // 从 localStorage 获取 Gemini API Key
  const apiKey = localStorage.getItem("geminiApiKey"); // 我们为Gemini使用不同的Key
  if (!apiKey) {
    return Promise.reject(
      new Error("Gemini API key is not set in localStorage.")
    );
  }

  // Gemini API 的地址和模型
  // 注意：Gemini 的 Key 是作为 URL 参数传递的
  const model = "gemini-pro";
  const url = `/v1beta/models/${model}:generateContent?key=${apiKey}`;

  return request({
    url: url,
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    // 直接将处理好的 params 作为 data 发送
    data: params,
  });
};
