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
 * 获取 OpenAI 的聊天回复 (通过我们的后端代理)
 */
export const fetchOpenAIChatCompletion = (params, apiKey, baseURL) => {
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
  const targetURL = `${baseURL}/v1/models`;
  const targetHeaders = {
    Authorization: `Bearer ${apiKey}`,
  };
  return proxyRequest(targetURL, "get", targetHeaders, null);
};
