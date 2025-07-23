import request from "../request.js";

// 这个函数用于调用后端的 gemini 网关
function callGeminiGateway(endpoint, method, apiKey, data) {
  return request({
    url: `/api/gemini/${endpoint}`,
    method: "post",
    data: {
      apiKey,
      data,
      method,
    },
  });
}

// (关键修复) 这个函数现在接收明确的参数：modelName 和聊天内容
export const fetchGeminiCompletion = (modelName, contentsData, apiKey) => {
  // 使用这些明确的参数，构建绝对正确的请求
  return callGeminiGateway(
    `v1beta/models/${modelName}:generateContent`,
    "post",
    apiKey,
    contentsData
  );
};

// 这个函数用于测试连接，它调用专属的、安全的后端路由，保持不变
export const fetchGeminiModels = (apiKey) => {
  return request({
    url: "/api/gemini/get-models",
    method: "post",
    data: {
      apiKey,
    },
  });
};
