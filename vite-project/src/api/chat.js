import { ElMessage } from "element-plus";

let abortController = null;

export async function testApiConnection(apiUrl, apiKey) {
  try {
    const response = await fetch(`${apiUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) {
      throw new Error(`服务器响应错误: ${response.status}`);
    }
    const data = await response.json();
    const modelNames = data.models.map((m) => m.id || m); // 兼容两种可能的返回格式
    ElMessage.success("连接成功！");
    return modelNames;
  } catch (error) {
    ElMessage.error(`连接失败: ${error.message}`);
    console.error("API Connection Test Failed:", error);
    return [];
  }
}

export async function fetchChatStream({
  apiUrl,
  apiKey,
  model,
  messages,
  onStream,
  onFinish,
  onError,
}) {
  abortController = new AbortController();

  try {
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorBody}`
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (onFinish) onFinish();
        break;
      }
      const chunk = decoder.decode(value, { stream: true });
      // SSE 数据可能在一次读取中包含多个 data: 事件
      const lines = chunk.split("\n\n").filter((line) => line.trim() !== "");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.substring(6);
          if (jsonStr === "[DONE]") {
            if (onFinish) onFinish();
            return; // 提前结束
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices[0]?.delta?.content || "";
            if (onStream) onStream(content);
          } catch (e) {
            console.error("Error parsing stream data chunk:", jsonStr, e);
          }
        }
      }
    }
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("Fetch aborted by user.");
      ElMessage.warning("已停止生成。");
      if (onFinish) onFinish();
    } else {
      console.error("Fetch stream error:", error);
      if (onError) onError(error.message);
    }
  } finally {
    abortController = null;
  }
}

export function stopGenerating() {
  if (abortController) {
    abortController.abort();
  }
}
