import axios from "axios";

// 创建一个没有固定 baseURL 的通用 axios 实例
const service = axios.create({
  // baseURL: '/',  <-- 移除这一行，让实例更灵活
  timeout: 60000,
});

// 请求拦截器可以保持不变
service.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器可以保持不变
service.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error("Response Error:", error);
    if (error.response) {
      console.error("Error data:", error.response.data);
    }
    return Promise.reject(error);
  }
);

export default service;
