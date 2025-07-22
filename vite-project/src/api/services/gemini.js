import request from "../request.js";

// 这是一个通用的函数，用于将请求打包并发送给我们的后端代理
function proxyRequest(url, method, headers, data) {
  return request({
    url: "/api/proxy", // 所有请求都发往这个固定的后端端点
    method: "post",
    data: {
      // 将目标信息作为请求体发送给后端
      url,
      method,
      headers,
      data,
    },
  });
}

/**
 * 获取 Google Gemini Pro 的聊天回复 (通过我们的后端代理)
 */
export const fetchGeminiCompletion = (params, apiKey, baseURL) => {
  const model = "gemini-pro";
  const targetURL = `${baseURL}/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const targetHeaders = {
    "Content-Type": "application/json",
  };
  return proxyRequest(targetURL, "post", targetHeaders, params);
};

/**
 * 测试连接并获取 Gemini 的模型列表 (通过我们的后端代理)
 */
export const fetchGeminiModels = (apiKey, baseURL) => {
  const targetURL = `${baseURL}/v1beta/models?key=${apiKey}`;
  return proxyRequest(targetURL, "get", {}, null); // GET 请求通常没有 headers 和 data
};
