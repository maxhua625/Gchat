import request from "../request.js";

// 调用后端的 /api/custom 路由
function callCustomGateway(url, method, apiKey, data) {
  return request({
    url: "/api/custom",
    method: "post",
    data: {
      url,
      apiKey,
      data,
      method,
    },
  });
}

export const fetchCustomChatCompletion = (params, apiKey, url) => {
  return callCustomGateway(
    `${url}/v1/chat/completions`,
    "post",
    apiKey,
    params
  );
};

export const fetchCustomModels = (apiKey, url) => {
  return callCustomGateway(`${url}/v1/models`, "get", apiKey, null);
};
