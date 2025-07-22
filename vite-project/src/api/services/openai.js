import request from "../request.js";

// 调用后端的 /api/openai/... 路由
function callOpenaiGateway(endpoint, method, apiKey, data) {
  return request({
    url: `/api/openai/${endpoint}`,
    method: "post", // 所有对后端的请求都是 POST
    data: {
      // 将 apiKey 和 data 包在请求体里
      apiKey,
      data,
      method,
    },
  });
}

export const fetchOpenAIChatCompletion = (params, apiKey) => {
  return callOpenaiGateway("v1/chat/completions", "post", apiKey, params);
};

export const fetchOpenAIModels = (apiKey) => {
  return callOpenaiGateway("v1/models", "get", apiKey, null);
};
