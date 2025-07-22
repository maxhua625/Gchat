import request from "../request.js";

// 这个函数保持不变，用于发送聊天
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

// 这个函数保持不变
export const fetchGeminiCompletion = (params, apiKey) => {
  const model = "gemini-pro";
  return callGeminiGateway(
    `v1beta/models/${model}:generateContent`,
    "post",
    apiKey,
    params
  );
};

// (关键修改) 这个函数现在调用专属的后端路由
export const fetchGeminiModels = (apiKey) => {
  return request({
    // 直接调用新的、硬编码的后端路由，不再传递 endpoint
    url: "/api/gemini/get-models",
    method: "post",
    data: {
      apiKey, // 我们只需要把 apiKey 发给后端即可
    },
  });
};
