import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post("/api/proxy", async (req, res) => {
  // 从请求体中解构出目标 API 的所有信息
  const { url, method, headers, data } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Target URL is required" });
  }

  console.log(`Proxying request to: ${method?.toUpperCase() || "GET"} ${url}`);

  try {
    // 优化：清理掉一些不必要的或可能导致冲突的请求头
    const headersToSend = { ...headers };
    delete headersToSend["host"];
    delete headersToSend["origin"];
    delete headersToSend["referer"];
    delete headersToSend["connection"];
    // Axios 会自动处理 Content-Length

    const response = await axios({
      url,
      method,
      headers: headersToSend,
      data,
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(
      "Proxy error details:",
      error.response?.data || error.message
    );
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
