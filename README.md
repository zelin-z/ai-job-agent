AI 岗位匹配分析助手
项目简介

AI 岗位匹配分析助手是一个面向实习求职场景的 AI 应用项目，支持用户输入岗位 JD 和个人简历 / 技能描述，系统会自动分析岗位要求与个人能力的匹配情况，并生成岗位匹配度、已匹配技能、缺失技能、简历优化建议、面试准备建议和 BOSS 打招呼话术。

项目采用前后端分离架构，前端使用 Vue3 + TypeScript + Vite + Element Plus，后端使用 Node.js + Express 封装 OpenAI API 调用接口。项目同时支持结构化 JSON 分析和 SSE 流式 AI 实时分析，用于提升 AI 生成内容的展示效果和用户等待体验。

在线演示：https://zelin-z.github.io/ai-job-agent/

后端服务：https://ai-job-agent-api-hb2e.onrender.com

源码地址：https://github.com/zelin-z/ai-job-agent

核心功能
支持输入岗位 JD，提取岗位核心要求
支持输入个人简历 / 技能描述
调用 OpenAI API 生成岗位匹配分析
生成岗位匹配度评分
展示已匹配技能和缺失技能
生成简历优化建议
生成面试准备建议
生成 BOSS 打招呼话术
支持 SSE 流式输出 AI 实时分析内容
支持 Markdown 渲染 AI 长文本分析结果
支持 OpenAI API 异常时 fallback 到本地规则分析
支持 localStorage 保存最近 10 条历史分析记录
支持点击历史记录恢复 JD、简历内容和分析结果
支持 loading 状态和基础错误提示
技术栈
前端
Vue3
TypeScript
Vite
Element Plus
marked
CSS
Vue ref / computed / watch
后端
Node.js
Express
OpenAI API
dotenv
cors
部署与其他
GitHub Pages
Render
SSE
RESTful API
localStorage
项目亮点
1. 前后端分离架构

前端负责岗位 JD 输入、简历内容输入、分析结果展示、历史记录管理和流式内容渲染；后端负责 OpenAI API 调用、Prompt 组织、JSON 结果解析和异常降级处理。

2. API Key 后端保护

OpenAI API Key 只配置在后端 .env 或 Render 环境变量中，前端不直接接触密钥，避免敏感信息暴露。

3. 结构化 JSON 分析

普通分析接口 /api/analyze 要求 AI 返回固定 JSON 字段，包括：

matchedRole
matchScore
requirements
matchedSkills
missingSkills
resumeAdvice
interviewTips
bossMessage

前端根据这些字段进行结构化展示，保证分析结果稳定可读。

4. SSE 流式输出

项目实现了 /api/analyze-stream 流式分析接口，后端通过 text/event-stream 分段返回 AI 生成内容，前端使用 fetch + ReadableStream 实时读取并追加展示，模拟 ChatGPT 一样的逐步生成效果。

5. Markdown 渲染

流式分析内容采用 Markdown 格式输出，前端使用 marked 渲染标题、列表和段落，让长文本分析结果更清晰。

6. fallback 降级机制

当没有配置 OpenAI API Key、OpenAI 调用失败或 JSON 解析失败时，系统会自动回退到本地规则分析，保证项目在 API 不可用时仍然可以运行。

7. 历史记录持久化

使用 localStorage 保存最近 10 条分析记录，支持恢复岗位 JD、个人简历内容、结构化分析结果和流式分析内容，形成“输入—分析—保存—回看”的完整使用闭环。

本地运行方式

安装依赖：

npm install

复制环境变量文件：

cp .env.example .env

在 .env 中配置：

PORT=3001
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-4.1-mini

启动前后端：

npm run dev:full

前端默认运行在：

http://localhost:5173/ai-job-agent/

后端默认运行在：

http://localhost:3001

如果不配置 OPENAI_API_KEY，项目仍然可以运行，并会使用本地 mock / fallback 逻辑返回分析结果。

线上部署说明

前端部署在 GitHub Pages：

https://zelin-z.github.io/ai-job-agent/

后端部署在 Render：

https://ai-job-agent-api-hb2e.onrender.com

前端通过 .env.production 中的 VITE_API_BASE_URL 指向线上后端服务：

VITE_API_BASE_URL=https://ai-job-agent-api-hb2e.onrender.com

注意：VITE_API_BASE_URL 只是公开后端地址，可以提交到仓库；OpenAI API Key 只能配置在后端环境变量中，不能提交到 GitHub。

API 说明
GET /

用于检查后端服务是否正常运行。

返回示例：

{
  "ok": true,
  "message": "AI Job Agent API is running"
}
GET /api/health

用于检查后端健康状态。

返回示例：

{
  "ok": true,
  "message": "server is running"
}
POST /api/analyze

结构化岗位分析接口。接收岗位 JD 和简历 / 技能描述，返回适合前端展示的 JSON 结果。

请求体示例：

{
  "jdText": "岗位 JD 内容",
  "resumeText": "个人简历、项目经历或技能描述"
}

返回字段包括：

{
  "source": "openai",
  "matchedRole": "AI 应用开发实习生",
  "matchScore": 95,
  "requirements": [],
  "matchedSkills": [],
  "missingSkills": [],
  "resumeAdvice": [],
  "interviewTips": [],
  "bossMessage": ""
}

其中 source 用于标记结果来源：

openai：OpenAI 调用成功
mock:no_api_key：未配置 API Key，使用本地 mock
mock:openai_error：OpenAI 调用失败，回退到本地 mock
mock:json_parse_error：AI 返回内容无法解析为 JSON，回退到本地 mock
POST /api/analyze-stream

AI 实时分析接口。使用 text/event-stream 返回 SSE 流式文本，前端逐段接收并渲染为 Markdown。

SSE 数据示例：

data: {"delta":"## 匹配结论\n"}

data: {"delta":"候选人与岗位整体匹配度较高..."}

data: {"done":true}
环境变量说明

本地开发使用 .env：

PORT=3001
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-4.1-mini

线上部署时，在 Render 后端服务中配置：

OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-4.1-mini

注意：.env 文件不要提交到 GitHub。仓库中只保留 .env.example，用于说明需要哪些配置项。
