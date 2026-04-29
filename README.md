# AI 岗位匹配分析助手

## 项目简介

AI 岗位匹配分析助手是一个基于 Vue3 + TypeScript + Express + OpenAI API 的 AI 应用项目。用户可以输入岗位 JD 和个人简历 / 技能描述，系统会生成岗位匹配度、已匹配技能、技能差距、简历优化建议、面试准备建议和 BOSS 打招呼话术。

项目同时支持结构化 JSON 分析和 SSE 流式 AI 实时分析：结构化分析用于稳定展示匹配度、技能标签和投递建议；流式分析用于实时生成 Markdown 格式的岗位匹配解读。

## 核心功能

- 岗位 JD 分析
- 简历 / 技能描述输入
- OpenAI API 智能分析
- 匹配度评分
- 已匹配技能和缺失技能展示
- 简历优化建议
- BOSS 打招呼话术生成
- SSE 流式输出 AI 实时分析
- Markdown 渲染
- API 失败时 fallback 到本地规则分析
- localStorage 历史记录保存和恢复
- loading 状态和基础错误提示

## 技术栈

### 前端

- Vue3
- TypeScript
- Vite
- Element Plus
- marked
- CSS
- Vue `ref` / `computed` / `watch` 管理页面状态

### 后端

- Node.js
- Express
- OpenAI API
- dotenv
- cors

### 其他

- SSE
- localStorage
- RESTful API

## 项目亮点

- 前后端分离：前端负责交互和展示，后端负责 AI 调用和接口封装。
- API Key 后端保护：OpenAI API Key 只从后端环境变量读取，不暴露到前端代码。
- OpenAI API 结构化 JSON 输出：普通分析接口要求 AI 返回固定 JSON 字段，方便前端稳定渲染。
- SSE 流式输出：实时接收 AI 生成内容，提升等待过程中的交互体验。
- Markdown 渲染：流式分析返回 Markdown，前端使用 marked 渲染为结构化内容。
- fallback 降级机制：无 API Key、OpenAI 调用失败或 JSON 解析失败时，自动回退到本地规则分析。
- 历史记录持久化：使用 localStorage 保存最近 10 条分析记录，并支持点击恢复输入和分析结果。

## 本地运行方式

```bash
npm install
cp .env.example .env
```

在 `.env` 中配置：

```bash
PORT=3001
OPENAI_API_KEY=你的 key
OPENAI_MODEL=gpt-4.1-mini
```

启动前后端：

```bash
npm run dev:full
```

如果不配置 `OPENAI_API_KEY`，项目仍然可以运行，并会使用本地 mock / fallback 逻辑返回分析结果。

## API 说明

### GET `/api/health`

用于检查后端服务是否正常运行。

返回示例：

```json
{
  "ok": true,
  "message": "server is running"
}
```

### POST `/api/analyze`

结构化岗位分析接口。接收岗位 JD 和简历 / 技能描述，返回适合前端展示的 JSON 结果。

请求体示例：

```json
{
  "jdText": "岗位 JD 内容",
  "resumeText": "个人简历、项目经历或技能描述"
}
```

返回字段包括：

- `matchedRole`
- `matchScore`
- `requirements`
- `matchedSkills`
- `missingSkills`
- `resumeAdvice`
- `interviewTips`
- `bossMessage`
- `source`

### POST `/api/analyze-stream`

AI 实时分析接口。使用 `text/event-stream` 返回 SSE 流式文本，前端逐段接收并渲染为 Markdown。

SSE 数据示例：

```text
data: {"delta":"## 匹配结论\n..."}

data: {"done":true}
```

## 环境变量说明

项目使用 `.env` 保存本地环境变量：

```bash
PORT=3001
OPENAI_API_KEY=你的 key
OPENAI_MODEL=gpt-4.1-mini
```

注意：`.env` 文件不要提交到 GitHub。仓库中只保留 `.env.example`，用于说明需要哪些配置项。

## 简历项目描述

开发了一个 AI 岗位匹配分析助手，基于 Vue3、TypeScript、Element Plus、Express 和 OpenAI API 实现前后端分离。项目支持输入岗位 JD 和个人简历 / 技能描述，调用 OpenAI 生成结构化岗位匹配分析，包括匹配度评分、已匹配技能、缺失技能、简历优化建议、面试准备建议和 BOSS 打招呼话术；同时实现 SSE 流式输出和 Markdown 渲染，提升 AI 生成过程的实时反馈体验。后端通过环境变量保护 API Key，并设计 fallback 机制，在 AI 接口失败时回退到本地规则分析；前端使用 localStorage 保存和恢复历史分析记录。

## 面试可讲点

1. 为什么 API Key 放在后端，而不是写在前端。
2. 如何使用 SSE 实现 AI 流式输出，以及前端如何读取 ReadableStream。
3. 如何要求 AI 返回结构化 JSON，并处理 JSON 解析失败的情况。
4. fallback 降级机制如何设计，保证无 API Key 或接口失败时项目仍可用。
5. localStorage 历史记录如何设计，如何保存输入、分析结果和流式内容并支持点击恢复。
