import request from "../request.js";

function forwardRequest(endpoint, method, apiKey, data) {
  return request({
    url: "/api/forward",
    method: "post",
    data: {
      provider: "openai",
      endpoint,
      method,
      apiKey,
      data,
    },
  });
}

export const fetchOpenAIChatCompletion = (params, apiKey) => {
  return forwardRequest("/v1/chat/completions", "post", apiKey, params);
};

export const fetchOpenAIModels = (apiKey) => {
  return forwardRequest("/v1/models", "get", apiKey, null);
};
