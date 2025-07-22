import * as openai from "./services/openai.js";
import * as gemini from "./services/gemini.js";
// 1. 导入新的 deepseek 服务
import * as deepseek from "./services/deepseek.js";

export default {
  openai,
  gemini,
  // 2. 导出 deepseek 服务
  deepseek,
};
