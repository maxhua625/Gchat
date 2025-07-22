import request from "../request.js";

// 调用后端的 /api/deepseek/... 路由
function callDeepseekGateway(endpoint, method, apiKey, data) {
  return request({
    url: `/api/deepseek/${endpoint}`,
    method: "post",
    data: {
      apiKey,
      data,
      method,
    },
  });
}

export const fetchDeepseekChatCompletion = (params, apiKey) => {
  return callDeepseekGateway("v1/chat/completions", "post", apiKey, params);
};

export const fetchDeepseekModels = (apiKey) => {
  return callDeepseekGateway("v1/models", "get", apiKey, null);
};
