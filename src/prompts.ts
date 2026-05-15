export type PromptVersion = "v1" | "v2";

export const promptV1 = (jd: string, resume: string) => {
  return `你是一个岗位匹配分析助手。请根据下面的岗位 JD 和候选人简历内容进行分析。

岗位 JD：
${jd}

候选人简历：
${resume || "未提供"}

请严格按照以下纯文本格式输出，不要使用 Markdown，不要输出 JSON，不要添加额外说明：
匹配分数：<0-100 的整数>
已匹配技能：<技能1、技能2、技能3；如果没有则写“无”>
缺失技能：<技能1、技能2、技能3；如果没有则写“无”>
优化建议：
1. <建议1>
2. <建议2>
3. <建议3>`;
};

export const promptV2 = (jd: string, resume: string) => {
  return `你是一个岗位匹配分析助手。请根据下面的岗位 JD 和候选人简历内容进行分析。

岗位 JD：
${jd}

候选人简历：
${resume || "未提供"}

请严格只输出 JSON，且必须完全符合以下 TypeScript 结构，不要输出任何其他文字、注释、Markdown 或代码块：
{
  "matchScore": number,
  "matchedSkills": string[],
  "missingSkills": string[],
  "suggestions": string[]
}`;
};
