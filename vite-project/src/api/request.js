import axios from "axios";

const service = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 60000,
});

service.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("Response Error from Backend:", error);
    if (error.response) {
      console.error("Backend Error data:", error.response.data);
    }
    return Promise.reject(error);
  }
);

export default service;
