import axios from "axios";

// 创建一个axios实例
const service = axios.create({
  // baseURL 将通过 Vite 的代理进行转发，所以这里不需要写完整的 OpenAI 地址
  // 例如，请求 /v1/chat/completions 会被代理到 https://api.openai.com/v1/chat/completions
  baseURL: "/",
  timeout: 60000, // 请求超时时间，对于AI请求可以设置长一些
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 可以在这里统一处理所有请求的头部等信息
    // 比如，你可以在这里统一添加token，但对于OpenAI的key我们选择在具体的service里添加更灵活
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 直接返回响应的 data 部分
    return response.data;
  },
  (error) => {
    console.error("Response Error:", error);
    // 这里可以对不同的HTTP状态码进行通用处理
    if (error.response) {
      // 例如处理 401 Unauthorized 等错误
      console.error("Error data:", error.response.data);
    }
    return Promise.reject(error);
  }
);

export default service;
