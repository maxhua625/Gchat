import axios from "axios";

// 这个实例的唯一目标就是我们自己的后端代理服务器
const service = axios.create({
  baseURL: "http://localhost:3000", // 硬编码指向我们的后端
  timeout: 60000,
});

// 请求拦截器保持不变
service.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器保持不变
service.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // 现在可以更清晰地看到来自后端的错误
    console.error("Response Error from Backend:", error);
    if (error.response) {
      console.error("Backend Error data:", error.response.data);
    }
    return Promise.reject(error);
  }
);

export default service;
