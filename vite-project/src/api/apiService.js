import request from "./request.js";

/**
 * 这是一个统一、智能的代理请求函数
 * @param {string} url - 目标 API 的完整 URL
 * @param {string} method - 请求方法 (e.g., 'get', 'post')
 * @param {object} headers - 要发送到目标 API 的请求头
 * @param {object|null} data - 要发送到目标 API 的请求体 (对于 GET 请求，应为 null)
 * @returns Promise
 */
export function proxyRequest(url, method, headers, data) {
  // 我们将所有信息打包，通过一个 POST 请求发送给我们自己的后端
  return request({
    url: "/api/proxy", // 所有请求都发往这个固定的后端端点
    method: "post",
    data: {
      // 将目标信息作为请求体发送给后端
      url,
      method,
      headers,
      data,
    },
  });
}
