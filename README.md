# AI 岗位匹配分析助手

## 项目简介

AI 岗位匹配分析助手是一个面向实习求职场景的 AI 应用项目，由本人独立完成前端页面开发、后端接口封装、OpenAI API 接入、流式输出处理和线上部署。

用户可以输入岗位 JD 和个人简历 / 技能描述，系统会自动分析岗位要求与个人能力之间的匹配情况，并生成岗位匹配度、已匹配技能、缺失技能、简历优化建议、面试准备建议和打招呼话术。

项目采用前后端分离架构：

- 前端基于 Vue3 + TypeScript + Vite + Element Plus 实现页面交互和结果展示
- 后端基于 Node.js + Express 封装 OpenAI API 调用接口
- 前端部署在 GitHub Pages
- 后端部署在 Render

项目同时支持结构化 JSON 分析和 SSE 流式 AI 分析。结构化分析用于稳定展示匹配度、技能标签和优化建议；流式分析用于实时生成 Markdown 格式的岗位匹配解读，提升 AI 生成过程中的用户体验。

在线演示：https://zelin-z.github.io/ai-job-agent/  
后端服务：https://ai-job-agent-api-hb2e.onrender.com  
源码地址：https://github.com/zelin-z/ai-job-agent

---

## 核心功能

- 岗位 JD 输入与分析
- 个人简历 / 技能描述输入
- OpenAI API 智能岗位匹配分析
- 岗位匹配度评分
- 已匹配技能展示
- 缺失技能展示
- 简历优化建议生成
- 面试准备建议生成
- 打招呼话术生成
- SSE 流式输出 AI 实时分析
- Markdown 渲染 AI 长文本结果
- API 异常时 fallback 到本地规则分析
- localStorage 历史记录保存与恢复
- 最近 10 条分析记录管理
- loading 状态与基础错误提示

---

## 技术栈

### 前端

- Vue3
- TypeScript
- Vite
- Element Plus
- marked
- CSS
- Vue `ref` / `computed` / `watch`

### 后端

- Node.js
- Express
- OpenAI API
- dotenv
- cors

### 部署与其他

- GitHub Pages
- Render
- RESTful API
- SSE
- localStorage

---

## 项目功能说明

### 1. 岗位匹配分析

用户输入岗位 JD 和个人简历 / 技能描述后，前端将数据提交到后端 `/api/analyze` 接口。后端根据岗位要求和个人能力信息组织 Prompt，并调用 OpenAI API 生成结构化分析结果。

分析结果包括：

- 匹配岗位
- 匹配度评分
- 岗位核心要求
- 已匹配技能
- 缺失技能
- 简历优化建议
- 面试准备建议
- 打招呼话术

---

### 2. 结构化 JSON 输出

为了保证前端展示稳定，后端要求 OpenAI 返回固定 JSON 结构。前端根据返回字段渲染不同模块，避免 AI 自由文本导致页面展示不可控。

返回数据结构示例：

```json
{
  "source": "openai",
  "matchedRole": "AI 应用开发实习生",
  "matchScore": 95,
  "requirements": ["Vue3", "TypeScript", "Node.js", "Express"],
  "matchedSkills": ["Vue3", "TypeScript", "Express", "OpenAI API"],
  "missingSkills": ["Prompt 工程"],
  "resumeAdvice": ["补充 Prompt 设计相关实践经验"],
  "interviewTips": ["准备讲解 OpenAI API 接入和 SSE 流式输出实现过程"],
  "bossMessage": "您好，我对该岗位很感兴趣，具备 Vue3、TypeScript 和 AI 应用开发项目经验，希望有机会进一步沟通。"
}
```

---

### 3. SSE 流式 AI 分析

除了普通结构化分析外，项目还实现了 `/api/analyze-stream` 流式分析接口。

后端通过 `text/event-stream` 分段返回 AI 生成内容，前端使用 `fetch + ReadableStream` 持续读取数据，并将内容实时追加到页面中，实现类似 ChatGPT 的逐步输出效果。

SSE 返回示例：

```text
data: {"delta":"## 匹配结论\n"}

data: {"delta":"候选人与岗位整体匹配度较高..."}

data: {"done":true}
```

---

### 4. Markdown 渲染

流式分析结果使用 Markdown 格式组织内容，例如：

- 匹配结论
- 已匹配能力
- 主要短板
- 简历优化建议
- 面试准备建议

前端使用 `marked` 将 Markdown 内容渲染为结构化页面，提升长文本分析结果的可读性。

---

### 5. fallback 降级机制

为了提高系统可用性，后端设计了 fallback 机制。

当出现以下情况时，系统会自动回退到本地规则分析：

- 未配置 OpenAI API Key
- OpenAI API 调用失败
- AI 返回内容无法解析为合法 JSON

返回结果中的 `source` 字段用于标记数据来源：

- `openai`：OpenAI 调用成功
- `mock:no_api_key`：未配置 API Key，使用本地规则分析
- `mock:openai_error`：OpenAI 调用失败，回退到本地规则分析
- `mock:json_parse_error`：JSON 解析失败，回退到本地规则分析

---

### 6. 历史记录保存与恢复

项目使用 localStorage 保存最近 10 条分析记录。每条记录包括：

- 岗位 JD
- 简历 / 技能描述
- 结构化分析结果
- 流式分析内容
- 创建时间
- 匹配岗位
- 匹配度

用户可以点击历史记录恢复之前的输入内容和分析结果，也可以一键清空历史记录。

---

## 项目亮点

### 前后端分离

前端负责页面交互、表单输入、结果展示、历史记录管理和 Markdown 渲染；后端负责 OpenAI API 调用、Prompt 组织、JSON 解析和异常降级处理。

### API Key 后端保护

OpenAI API Key 只配置在后端 `.env` 或 Render 环境变量中，前端代码不会暴露密钥，避免敏感信息泄露。

### 结构化展示

通过固定 JSON 字段约束 AI 返回内容，使岗位匹配结果可以稳定展示在前端页面中。

### 流式输出体验

通过 SSE 和 ReadableStream 实现 AI 内容的实时生成效果，避免用户等待整段结果返回。

### 异常降级能力

当 AI 接口不可用时，系统仍可以通过本地规则分析返回基础结果，保证项目可运行。

### 线上完整部署

项目已完成前端 GitHub Pages 部署和后端 Render 部署，线上版本可以直接访问和测试。

---

## 本地运行方式

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制环境变量示例文件：

```bash
cp .env.example .env
```

在 `.env` 中配置：

```bash
PORT=3001
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-4.1-mini
```

### 3. 启动前后端

```bash
npm run dev:full
```

前端默认运行在：

```bash
http://localhost:5173/ai-job-agent/
```

后端默认运行在：

```bash
http://localhost:3001
```

如果不配置 `OPENAI_API_KEY`，项目仍然可以运行，并会使用本地 fallback 逻辑返回基础分析结果。

---

## 线上部署

### 前端部署

前端部署在 GitHub Pages：

```text
https://zelin-z.github.io/ai-job-agent/
```

生产环境通过 `.env.production` 配置后端地址：

```bash
VITE_API_BASE_URL=https://ai-job-agent-api-hb2e.onrender.com
```

### 后端部署

后端部署在 Render：

```text
https://ai-job-agent-api-hb2e.onrender.com
```

Render 环境变量配置：

```bash
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-4.1-mini
```

注意：OpenAI API Key 只配置在后端环境变量中，不应提交到 GitHub。

---

## API 说明

### GET `/`

检查后端服务是否正常运行。

返回示例：

```json
{
  "ok": true,
  "message": "AI Job Agent API is running"
}
```

---

### GET `/api/health`

检查后端健康状态。

返回示例：

```json
{
  "ok": true,
  "message": "server is running"
}
```

---

### POST `/api/analyze`

结构化岗位匹配分析接口。

请求体示例：

```json
{
  "jdText": "岗位 JD 内容",
  "resumeText": "个人简历、项目经历或技能描述"
}
```

返回字段：

```json
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
```

---

### POST `/api/analyze-stream`

AI 实时分析接口，使用 SSE 返回流式文本。

返回示例：

```text
data: {"delta":"## 匹配结论\n"}

data: {"delta":"候选人与岗位整体匹配度较高..."}

data: {"done":true}
```

---

## 目录结构

```text
ai-job-agent
├── server
│   └── index.js
├── src
│   ├── App.vue
│   └── main.ts
├── public
├── .env.example
├── .env.production
├── package.json
├── vite.config.ts
└── README.md
```

---

## 环境变量说明

本地开发使用 `.env`：

```bash
PORT=3001
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-4.1-mini
```

线上前端使用 `.env.production`：

```bash
VITE_API_BASE_URL=https://ai-job-agent-api-hb2e.onrender.com
```

注意：

- `.env` 不要提交到 GitHub
- `.env.example` 用于说明项目需要哪些环境变量
- OpenAI API Key 只能放在后端环境变量中
- `VITE_API_BASE_URL` 是公开后端地址，可以放在前端环境变量中

---

## 项目总结

本项目完整实现了一个 AI 岗位匹配分析工具，从前端页面交互、后端接口封装、OpenAI API 接入、SSE 流式输出、Markdown 渲染、fallback 降级机制，到前后端线上部署，形成了一个完整的 AI 应用开发闭环。

项目重点实践了 AI 能力在真实业务场景中的接入方式，也展示了前端项目如何结合 Node.js 后端和大模型 API 构建可用的 AI 应用。
