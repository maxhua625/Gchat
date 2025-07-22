// 导入所有 service 文件中的 API
import * as openai from "./services/openai.js";
// 新增：导入 gemini 服务
import * as gemini from "./services/gemini.js";

// 统一导出
export default {
  openai,
  gemini, // 新增：导出 gemini
};
