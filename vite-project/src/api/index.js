import * as openai from "./services/openai.js";
import * as gemini from "./services/gemini.js";
import * as deepseek from "./services/deepseek.js";
// 1. 导入新的 custom 服务
import * as custom from "./services/custom.js";

export default {
  openai,
  gemini,
  deepseek,
  // 2. 导出 custom 服务
  custom,
};
