import request from "../request.js"; // 我们依然使用 axios 实例

const backendProxyUrl = "http://localhost:3000/api/proxy";

export const fetchOpenAIChatCompletion = (params, apiKey, baseURL) => {
  return request.post(backendProxyUrl, {
    baseURL: baseURL,
    path: "/v1/chat/completions",
    method: "post",
    apiKey: apiKey,
    data: {
      model: params.model,
      messages: params.messages,
    },
  });
};

export const fetchOpenAIModels = (apiKey, baseURL) => {
  return request.post(backendProxyUrl, {
    baseURL: baseURL,
    path: "/v1/models",
    method: "get",
    apiKey: apiKey,
  });
};
