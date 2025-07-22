import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post("/api/proxy", async (req, res) => {
  const { url, method, headers, data } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Target URL is required" });
  }

  const requestMethod = method?.toUpperCase() || "GET";
  console.log(`Proxying request to: ${requestMethod} ${url}`);

  try {
    const axiosConfig = {
      url,
      method: requestMethod,
      headers: { ...headers },
    };

    delete axiosConfig.headers["host"];
    delete axiosConfig.headers["origin"];
    delete axiosConfig.headers["referer"];
    delete axiosConfig.headers["connection"];

    if (requestMethod !== "GET" && data) {
      axiosConfig.data = data;
    }

    const response = await axios(axiosConfig);

    res.status(response.status).json(response.data);
  } catch (error) {
    // 关键：在后端控制台打印出最详细的错误信息
    console.error("--- PROXY ERROR ---");
    console.error("Request to:", url);
    if (error.response) {
      // 如果错误来自目标 API 服务器 (例如 OpenAI, Google)
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else if (error.request) {
      // 如果请求已发出但没有收到响应
      console.error("No response received:", error.request);
    } else {
      // 如果是请求设置阶段的错误
      console.error("Error setting up request:", error.message);
    }
    console.error("--- END PROXY ERROR ---");

    const status = error.response?.status || 500;
    const errorData = error.response?.data || {
      error: "An unknown error occurred in the proxy.",
    };
    res.status(status).json(errorData);
  }
});

app.listen(PORT, () => {
  console.log(`Backend proxy server listening on port ${PORT}`);
});
