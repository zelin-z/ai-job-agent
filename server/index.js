import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    message: "server is running",
  });
});

const createMockAnalysis = (cleanJdText, resumeText = "", source = "mock:no_api_key") => {
  const sourceText = `${cleanJdText} ${resumeText}`.toLowerCase();
  const skillRules = [
    { label: "Vue3", aliases: ["vue3", "vue"] },
    { label: "React", aliases: ["react"] },
    { label: "TypeScript", aliases: ["typescript", "ts"] },
    { label: "JavaScript", aliases: ["javascript", "js"] },
    { label: "Element Plus", aliases: ["element plus", "element-plus"] },
    { label: "Axios", aliases: ["axios"] },
    { label: "Pinia", aliases: ["pinia"] },
    { label: "Vue Router", aliases: ["vue router"] },
    { label: "Node.js", aliases: ["node.js", "node"] },
    { label: "Express", aliases: ["express"] },
    { label: "Java", aliases: ["java"] },
    { label: "Spring Boot", aliases: ["spring boot", "springboot"] },
    { label: "Python", aliases: ["python"] },
    { label: "MySQL", aliases: ["mysql"] },
    { label: "CRM", aliases: ["crm"] },
    { label: "ERP", aliases: ["erp"] },
  ];

  const matchedSkills = skillRules
    .filter((skill) => skill.aliases.some((alias) => sourceText.includes(alias)))
    .map((skill) => skill.label);
  const missingSkills = matchedSkills.filter((skill) =>
    ["React", "Java", "Spring Boot", "Python"].includes(skill),
  );
  const matchScore = Math.min(95, Math.max(60, 75 + matchedSkills.length * 2 - missingSkills.length * 5));
  const matchedRole =
    cleanJdText.includes("前端") || sourceText.includes("vue") || sourceText.includes("react")
      ? "前端开发实习生"
      : cleanJdText.includes("后端") || sourceText.includes("spring boot")
        ? "后端开发实习生"
        : cleanJdText.includes("实施") || sourceText.includes("crm") || sourceText.includes("erp")
          ? "实施顾问实习生"
          : "相关实习岗位";

  return {
    source,
    matchedRole,
    matchScore,
    requirements: [
      `熟悉 ${matchedSkills.slice(0, 3).join(" / ") || "岗位相关技术栈"}`,
      "具备项目开发或接口联调经验",
      "能够根据业务需求完成页面或功能实现",
      "有良好的沟通能力和学习能力",
    ],
    matchedSkills: matchedSkills.length > 0 ? matchedSkills : ["未识别到明确关键词"],
    missingSkills,
    resumeAdvice:
      missingSkills.length > 0
        ? [`建议优先突出已匹配技能，并对 ${missingSkills.join("、")} 做基础补充。`]
        : ["建议重点突出项目经验、接口联调能力和与岗位技术栈相关的实践经历。"],
    interviewTips: ["面试前准备一个能说明业务场景、技术方案和个人贡献的项目案例。"],
    bossMessage: `您好，我对${matchedRole}方向很感兴趣，具备项目开发和接口联调经验，想了解该岗位是否还有机会。`,
  };
};

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "matchedRole",
    "matchScore",
    "requirements",
    "matchedSkills",
    "missingSkills",
    "resumeAdvice",
    "interviewTips",
    "bossMessage",
  ],
  properties: {
    matchedRole: { type: "string" },
    matchScore: { type: "number", minimum: 0, maximum: 100 },
    requirements: { type: "array", items: { type: "string" } },
    matchedSkills: { type: "array", items: { type: "string" } },
    missingSkills: { type: "array", items: { type: "string" } },
    resumeAdvice: { type: "array", items: { type: "string" } },
    interviewTips: { type: "array", items: { type: "string" } },
    bossMessage: { type: "string" },
  },
};

const getOpenAIResponseText = async (cleanJdText, resumeText) => {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const model = process.env.OPENAI_MODEL || "gpt-5.5";

  const response = await client.responses.create({
    model,
    instructions:
      "你是一个求职岗位分析助手。请根据用户提供的岗位 JD 和简历内容，返回严格 JSON。不要 Markdown，不要解释文字，不要代码块。",
    input: `岗位 JD:\n${cleanJdText}\n\n简历内容:\n${resumeText || "未提供"}`,
    text: {
      format: {
        type: "json_schema",
        name: "job_analysis_result",
        strict: true,
        schema: analysisSchema,
      },
    },
  });

  return response.output_text;
};

app.post("/api/analyze", async (req, res) => {
  const { jdText = "", resumeText = "" } = req.body;
  const cleanJdText = String(jdText).trim();
  const cleanResumeText = String(resumeText || "").trim();

  if (!cleanJdText) {
    return res.status(400).json({
      source: "validation_error",
      error: "岗位 JD 不能为空",
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.json(createMockAnalysis(cleanJdText, cleanResumeText, "mock:no_api_key"));
  }

  let outputText = "";

  try {
    outputText = await getOpenAIResponseText(cleanJdText, cleanResumeText);
  } catch (error) {
    console.error({
      status: error.status,
      code: error.code,
      message: error.message,
    });
    return res.json(createMockAnalysis(cleanJdText, cleanResumeText, "mock:openai_error"));
  }

  try {
    const aiResult = JSON.parse(outputText);
    return res.json({
      source: "openai",
      ...aiResult,
    });
  } catch {
    console.error("JSON parse failed", outputText.slice(0, 300));
    return res.json(createMockAnalysis(cleanJdText, cleanResumeText, "mock:json_parse_error"));
  }
});

const writeSSE = (res, payload) => {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

app.post("/api/analyze-stream", async (req, res) => {
  const { jdText = "", resumeText = "" } = req.body;
  const cleanJdText = String(jdText).trim();
  const cleanResumeText = String(resumeText || "").trim();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  if (!cleanJdText) {
    writeSSE(res, { delta: "岗位 JD 不能为空，请先粘贴完整的岗位描述。" });
    writeSSE(res, { done: true });
    return res.end();
  }

  if (!process.env.OPENAI_API_KEY) {
    const mockParts = [
      "## 匹配结论\n候选人与该岗位整体匹配度中等偏高，岗位重点与前端开发、项目实践和接口联调能力相关。\n\n",
      "## 已匹配能力\n- 具备前端项目开发基础\n- 能理解页面功能实现和接口联调场景\n",
      cleanResumeText
        ? "- 已提供个人简历或技能描述，可进一步结合经历细化分析\n\n"
        : "\n",
      "## 主要短板\n- 需要补充更具体的项目成果和业务场景\n- 如果 JD 有特定技术栈，需要确认是否有实际使用经验\n\n",
      "## 简历优化建议\n- 在项目经历中补充技术方案、个人职责和最终效果\n- 优先突出与 JD 关键词一致的技能和实践\n\n",
      "## 面试准备建议\n- 准备一个能说明业务场景、技术方案和个人贡献的项目案例\n- 提前整理接口联调、问题排查和项目复盘相关话术\n",
    ];

    for (const part of mockParts) {
      writeSSE(res, { delta: part });
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    writeSSE(res, { done: true });
    return res.end();
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const model = process.env.OPENAI_MODEL || "gpt-5.5";
    const stream = await client.responses.create({
      model,
      instructions:
        `你是一个求职岗位分析助手。请必须用中文 Markdown 输出岗位匹配分析，不要返回 JSON，不要使用代码块。
输出格式固定为：

## 匹配结论
简短说明候选人与岗位的整体匹配情况。

## 已匹配能力
- 列出候选人已经具备的技能或经验

## 主要短板
- 列出候选人和 JD 相比缺少的能力

## 简历优化建议
- 给出可以补充到简历或项目里的建议

## 面试准备建议
- 给出面试前应该准备的问题或话术`,
      input: `岗位 JD:\n${cleanJdText}\n\n简历内容:\n${cleanResumeText || "未提供"}`,
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === "response.output_text.delta" && event.delta) {
        writeSSE(res, { delta: event.delta });
      }
    }

    writeSSE(res, { done: true });
    return res.end();
  } catch (error) {
    console.error({
      status: error.status,
      code: error.code,
      message: error.message,
    });
    writeSSE(res, {
      delta: "AI 流式分析暂时不可用，已收到后端错误。请稍后重试，或先使用普通分析功能。",
    });
    writeSSE(res, { done: true });
    return res.end();
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
