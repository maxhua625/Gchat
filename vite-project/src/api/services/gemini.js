import request from "../request.js";

const backendProxyUrl = "http://localhost:3000/api/proxy";

export const fetchGeminiCompletion = (params, apiKey, baseURL) => {
  // Gemini 的 key 在 path 中，所以 apiKey 传空字符串，避免在 header 中重复
  const path = `/v1beta/models/${params.model}:generateContent?key=${apiKey}`;

  return request.post(backendProxyUrl, {
    baseURL: baseURL,
    path: path,
    method: "post",
    apiKey: "", // 传空，因为 key 已经在 path 里
    data: params.data,
  });
};

export const fetchGeminiModels = (apiKey, baseURL) => {
  const path = `/v1beta/models?key=${apiKey}`;

  return request.post(backendProxyUrl, {
    baseURL: baseURL,
    path: path,
    method: "get",
    apiKey: "",
  });
};
