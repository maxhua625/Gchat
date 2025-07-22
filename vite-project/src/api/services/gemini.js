import request from "../request.js";

function forwardRequest(endpoint, method, apiKey, data) {
  // Gemini 的 key 作为 URL 参数，所以 endpoint 需要拼接
  const finalEndpoint = `${endpoint}?key=${apiKey}`;
  return request({
    url: "/api/forward",
    method: "post",
    data: {
      provider: "gemini",
      endpoint: finalEndpoint, // 发送拼接好的 endpoint
      method,
      // apiKey 在这里仅用于拼接，不需要再传给后端 header
      apiKey: null,
      data,
    },
  });
}

export const fetchGeminiCompletion = (params, apiKey) => {
  const model = "gemini-pro";
  return forwardRequest(
    `/v1beta/models/${model}:generateContent`,
    "post",
    apiKey,
    params
  );
};

export const fetchGeminiModels = (apiKey) => {
  return forwardRequest("/v1beta/models", "get", apiKey, null);
};
