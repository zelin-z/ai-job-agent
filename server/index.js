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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
