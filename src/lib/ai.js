import { chatUpdateMock, generateWorkflowPreset } from './aiMock'

// 项目为纯演示：AI 能力由本地预设工作流 / 规则解析模拟，不请求外部接口。
// 对外保持稳定接口，未来若要接入真实 AI，只需替换本文件内的实现。

export async function generateWorkflow(userInput) {
  return generateWorkflowPreset(userInput)
}

export async function updateWorkflowViaChat(userMessage, graph) {
  return chatUpdateMock(userMessage, graph)
}
