<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { marked } from "marked";

const jdText = ref("");
const resumeText = ref("");
const streamingText = ref("");
const isAnalyzing = ref(false);
const isStreaming = ref(false);
const hasResult = ref(false);

const result = ref({
  score: 0,
  keywords: [] as string[],
  missingSkills: [] as string[],
  requirements: [] as string[],
  match: "",
  resumeAdvice: "",
  applySuggestion: "",
  greeting: "",
});

const streamingHtml = computed(() =>
  marked.parse(streamingText.value, { async: false }),
);

type HistoryItem = {
  job: string;
  match: string;
  time: string;
};

const HISTORY_KEY = "ai-job-agent-history";

const defaultHistoryList: HistoryItem[] = [
  { job: "前端开发实习生", match: "82%", time: "今天" },
  { job: "实施顾问实习生", match: "76%", time: "今天" },
];

const loadHistoryList = (): HistoryItem[] => {
  const saved = localStorage.getItem(HISTORY_KEY);

  if (!saved) {
    return defaultHistoryList;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : defaultHistoryList;
  } catch {
    return defaultHistoryList;
  }
};

const historyList = ref<HistoryItem[]>(loadHistoryList());

watch(
  historyList,
  (newList) => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newList));
  },
  { deep: true },
);

const getJobTitle = (text: string) => {
  if (text.includes("前端") || text.includes("Vue") || text.includes("React")) {
    return "前端开发实习生";
  }

  if (
    text.includes("后端") ||
    text.includes("Java") ||
    text.includes("Spring Boot")
  ) {
    return "后端开发实习生";
  }

  if (text.includes("实施") || text.includes("ERP") || text.includes("CRM")) {
    return "实施顾问实习生";
  }

  if (
    text.includes("AI") ||
    text.includes("大模型") ||
    text.includes("Agent")
  ) {
    return "AI 应用实习生";
  }

  return "相关实习岗位";
};

type SkillItem = {
  label: string;
  aliases: string[];
};

const skillMap: SkillItem[] = [
  { label: "Vue3", aliases: ["vue3", "vue"] },
  { label: "React", aliases: ["react"] },
  { label: "TypeScript", aliases: ["typescript", "ts"] },
  { label: "JavaScript", aliases: ["javascript", "js"] },
  {
    label: "Element Plus",
    aliases: ["element plus", "element-plus", "elementplus"],
  },
  { label: "Axios", aliases: ["axios"] },
  { label: "Pinia", aliases: ["pinia"] },
  { label: "Vue Router", aliases: ["vue router", "vuerouter"] },
  { label: "权限管理", aliases: ["权限", "权限管理", "rbac", "角色权限"] },
  { label: "接口联调", aliases: ["接口", "接口联调", "api", "前后端联调"] },
  { label: "后台管理系统", aliases: ["后台管理", "管理系统", "admin"] },
  { label: "MySQL", aliases: ["mysql"] },
  { label: "Node.js", aliases: ["node", "node.js"] },
  { label: "Express", aliases: ["express"] },
  { label: "CRM", aliases: ["crm"] },
  { label: "ERP", aliases: ["erp"] },
  { label: "沟通能力", aliases: ["沟通", "客户沟通", "需求沟通"] },
  { label: "Java", aliases: ["java"] },
  { label: "Spring Boot", aliases: ["spring boot", "springboot"] },
  { label: "Python", aliases: ["python"] },
];

const mySkills = [
  "Vue3",
  "TypeScript",
  "JavaScript",
  "Element Plus",
  "Axios",
  "Pinia",
  "Vue Router",
  "权限管理",
  "接口联调",
  "后台管理系统",
  "MySQL",
  "Node.js",
  "Express",
  "CRM",
  "ERP",
  "沟通能力",
];

const extractKeywords = (text: string) => {
  const lowerText = text.toLowerCase();

  const matched = skillMap
    .filter((skill) =>
      skill.aliases.some((alias) => lowerText.includes(alias.toLowerCase())),
    )
    .map((skill) => skill.label);

  return Array.from(new Set(matched));
};

const calculateScore = (keywords: string[]) => {
  if (keywords.length === 0) {
    return 60;
  }

  const matchedCount = keywords.filter((keyword) =>
    mySkills.includes(keyword),
  ).length;

  const ratio = matchedCount / keywords.length;
  return Math.round(50 + ratio * 45);
};

const getMissingSkills = (keywords: string[]) => {
  return keywords.filter((keyword) => !mySkills.includes(keyword));
};

const generateResumeAdvice = (keywords: string[], missingSkills: string[]) => {
  if (keywords.length === 0) {
    return "建议先补充更完整的岗位 JD，再根据岗位技术栈调整简历重点。当前可以优先突出项目经验、学习能力、沟通能力和接口联调经验。";
  }

  if (missingSkills.length === 0) {
    return "该岗位要求与你现有技能匹配度较高。建议在简历中重点突出 Vue3、TypeScript、接口联调、权限管理、后台管理系统等项目经验，并用“业务场景 + 技术方案 + 解决的问题”来描述项目。";
  }

  return `该岗位中 ${missingSkills.join("、")} 与你当前技能画像存在一定差距。建议简历中优先突出已匹配技能，例如 ${keywords
    .filter((item) => mySkills.includes(item))
    .slice(0, 4)
    .join("、")}；对于 ${missingSkills.join(
    "、",
  )}，可以在面试前做基础了解，简历中不要过度包装。`;
};

const generateApplySuggestion = (score: number, missingSkills: string[]) => {
  if (score >= 80 && missingSkills.length <= 1) {
    return "建议投递。该岗位与你当前技能匹配度较高，可以重点突出已有项目经验，并尽快发送定制化打招呼话术。";
  }

  if (score >= 65) {
    return "可以投递，但需要谨慎准备。建议投递前补充岗位中缺失的核心技能，并在简历中突出已匹配的项目经验。";
  }

  return "暂不建议优先投递。当前岗位与技能画像差距较大，建议先补充核心技术栈，或者优先选择匹配度更高的岗位。";
};
const generateRequirements = (keywords: string[]) => {
  if (keywords.length === 0) {
    return [
      "岗位 JD 描述较泛，需要进一步拆解要求",
      "建议补充岗位技术栈、工作内容和任职要求",
      "可以先从沟通能力、学习能力和项目经验角度准备",
    ];
  }

  return [
    `熟悉 ${keywords.slice(0, 3).join(" / ")}`,
    "具备项目开发或接口联调经验",
    "能够理解业务需求并完成页面功能实现",
    "有良好的沟通能力和学习能力",
  ];
};

const generateGreeting = (
  jobTitle: string,
  keywords: string[],
  score: number,
) => {
  const skillText =
    keywords.length > 0
      ? keywords.slice(0, 4).join("、")
      : "项目开发、接口联调和需求理解";

  if (score >= 80) {
    return `您好，我是阿尔伯塔大学计算机本科生，具备 ${skillText} 相关经验，做过后台管理系统项目。对${jobTitle}方向很感兴趣，6月中下旬可到岗，每周5天，想了解该岗位是否还有机会。`;
  }

  if (score >= 65) {
    return `您好，我是阿尔伯塔大学计算机本科生，有项目开发和接口联调经验，也了解 ${skillText}。对${jobTitle}方向感兴趣，学习能力较强，6月中下旬可到岗，想了解该岗位是否还有机会。`;
  }

  return `您好，我是阿尔伯塔大学计算机本科生，有前端项目和接口联调经验。虽然与${jobTitle}部分要求还有差距，但我学习能力较强，愿意尽快补齐相关技术，想了解该岗位是否还有机会。`;
};

const isValidJD = (text: string) => {
  const cleanText = text.trim();

  if (cleanText.length < 20) {
    return false;
  }

  const jdWords = [
    "招聘",
    "岗位",
    "职责",
    "要求",
    "任职",
    "实习",
    "开发",
    "前端",
    "后端",
    "产品",
    "运营",
    "实施",
    "工程师",
  ];

  return jdWords.some((word) => cleanText.includes(word));
};

type AnalyzeApiResult = {
  matchedRole: string;
  matchScore: number;
  requirements: string[];
  matchedSkills: string[];
  missingSkills: string[];
  resumeAdvice: string[];
  interviewTips: string[];
  bossMessage: string;
};

const applyLocalAnalysis = (cleanText: string) => {
  const jobTitle = getJobTitle(cleanText);
  const keywords = extractKeywords(cleanText);
  const score = calculateScore(keywords);
  const missingSkills = getMissingSkills(keywords);

  result.value = {
    score,
    keywords: keywords.length > 0 ? keywords : ["未识别到明确关键词"],
    missingSkills,
    requirements: generateRequirements(keywords),
    match:
      score >= 80
        ? "匹配度较高。你的后台管理系统项目可以重点突出登录鉴权、权限菜单、搜索分页、接口联调和数据可视化。"
        : score >= 65
          ? "匹配度中等。你可以重点强调项目开发经验、接口联调能力和学习能力，同时补充岗位中要求较多的技术点。"
          : "匹配度一般。建议先补充该岗位核心技术栈，再投递类似岗位，避免简历和 JD 差距过大。",
    resumeAdvice: generateResumeAdvice(keywords, missingSkills),
    applySuggestion: generateApplySuggestion(score, missingSkills),
    greeting: generateGreeting(jobTitle, keywords, score),
  };

  historyList.value.unshift({
    job: jobTitle,
    match: `${score}%`,
    time: new Date().toLocaleTimeString(),
  });

  historyList.value = historyList.value.slice(0, 10);
};

const applyApiAnalysis = (apiResult: AnalyzeApiResult) => {
  const score = apiResult.matchScore;

  result.value = {
    score,
    keywords:
      apiResult.matchedSkills.length > 0
        ? apiResult.matchedSkills
        : ["未识别到明确关键词"],
    missingSkills: apiResult.missingSkills,
    requirements: apiResult.requirements,
    match: `模拟 AI 识别岗位为「${apiResult.matchedRole}」，匹配度为 ${score}%。${apiResult.interviewTips.join(" ")}`,
    resumeAdvice: apiResult.resumeAdvice.join(" "),
    applySuggestion: generateApplySuggestion(score, apiResult.missingSkills),
    greeting: apiResult.bossMessage,
  };

  historyList.value.unshift({
    job: apiResult.matchedRole,
    match: `${score}%`,
    time: new Date().toLocaleTimeString(),
  });

  historyList.value = historyList.value.slice(0, 10);
};

const analyzeJD = async () => {
  const cleanText = jdText.value.trim();

  if (!cleanText) {
    ElMessage.warning("请先粘贴岗位 JD");
    return;
  }

  if (!isValidJD(cleanText)) {
    ElMessage.warning("请输入更完整的岗位 JD，例如岗位职责、任职要求或技术栈");
    return;
  }

  isAnalyzing.value = true;
  hasResult.value = false;

  try {
    const response = await fetch("http://localhost:3001/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jdText: cleanText,
        resumeText: resumeText.value.trim(),
      }),
    });

    if (!response.ok) {
      throw new Error("Analyze API request failed");
    }

    const apiResult = (await response.json()) as AnalyzeApiResult;
    applyApiAnalysis(apiResult);
    ElMessage.success("分析完成");
  } catch {
    applyLocalAnalysis(cleanText);
    ElMessage.warning("后端接口不可用，已使用本地规则分析");
  } finally {
    isAnalyzing.value = false;
    hasResult.value = true;
  }
};

const analyzeStream = async () => {
  const cleanText = jdText.value.trim();

  if (!cleanText) {
    ElMessage.warning("请先粘贴岗位 JD");
    return;
  }

  isStreaming.value = true;
  streamingText.value = "";

  try {
    const response = await fetch("http://localhost:3001/api/analyze-stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jdText: cleanText,
        resumeText: resumeText.value.trim(),
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error("Stream API request failed");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let done = false;

    while (!done) {
      const result = await reader.read();
      done = result.done;
      buffer += decoder.decode(result.value, { stream: !done });

      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        const dataLine = event
          .split("\n")
          .find((line) => line.startsWith("data: "));

        if (!dataLine) {
          continue;
        }

        const data = JSON.parse(dataLine.slice(6));

        if (data.delta) {
          streamingText.value += data.delta;
        }

        if (data.done) {
          done = true;
          break;
        }
      }
    }
  } catch {
    ElMessage.error("流式分析失败，请确认后端服务已启动");
  } finally {
    isStreaming.value = false;
  }
};

const copyGreeting = async () => {
  if (!result.value.greeting) {
    ElMessage.warning("暂无可复制的话术");
    return;
  }

  try {
    await navigator.clipboard.writeText(result.value.greeting);
    ElMessage.success("打招呼话术已复制");
  } catch {
    ElMessage.error("复制失败，请手动复制");
  }
};

const clearHistory = () => {
  historyList.value = [];
  localStorage.removeItem(HISTORY_KEY);
  ElMessage.success("历史记录已清空");
};
</script>
<template>
  <div class="page">
    <h1>AI 实习岗位分析助手</h1>
    <div class="main">
      <el-card class="left-card">
        <template #header>
          <span>岗位 JD 输入</span>
        </template>
        <el-input
          v-model="jdText"
          type="textarea"
          :rows="12"
          placeholder="请粘贴招聘岗位描述..."
        ></el-input>

        <div class="resume-label">个人简历 / 技能描述</div>
        <el-input
          v-model="resumeText"
          type="textarea"
          :rows="6"
          placeholder="请粘贴你的简历项目经历、技能栈或个人介绍..."
        ></el-input>

        <div class="button-row">
          <el-button
            type="primary"
            class="analyze-btn"
            :loading="isAnalyzing"
            :disabled="isAnalyzing || isStreaming"
            @click="analyzeJD"
            >{{ isAnalyzing ? "分析中..." : "开始分析" }}</el-button
          >
          <el-button
            class="analyze-btn"
            :loading="isStreaming"
            :disabled="isAnalyzing || isStreaming"
            @click="analyzeStream"
          >
            {{ isStreaming ? "生成中..." : "流式分析" }}
          </el-button>
        </div>
      </el-card>
      <el-card class="right-card">
        <template #header>
          <span>分析结果</span>
        </template>
        <el-empty v-if="!hasResult" description="请先输入 JD 并开始分析">
        </el-empty>
        <div v-else class="result">
          <div class="score-box">
            <h3>岗位匹配度</h3>
            <el-progress
              :percentage="result.score"
              :stroke-width="18"
            ></el-progress>
          </div>
          <div class="tag-box">
            <h3>核心技术关键词</h3>
            <el-tag
              v-for="tag in result.keywords"
              :key="tag"
              class="keyword-tag"
              type="success"
            >
              {{ tag }}
            </el-tag>
          </div>

          <h3>1. 岗位核心要求</h3>
          <ul>
            <li v-for="item in result.requirements" :key="item">
              {{ item }}
            </li>
          </ul>
          <h3>2. 与我的技能匹配度</h3>
          <p>{{ result.match }}</p>
          <h3>3. 简历优化建议</h3>
          <p>{{ result.resumeAdvice }}</p>

          <h3>4. 投递建议</h3>
          <el-alert
            :title="result.applySuggestion"
            type="warning"
            :closable="false"
            show-icon
          ></el-alert>

          <h3>5. BOSS 打招呼话术</h3>
          <el-alert
            :title="result.greeting"
            type="success"
            :closable="false"
          ></el-alert>
          <el-button type="success" class="copy-btn" @click="copyGreeting">
            复制话术
          </el-button>
        </div>
        <div v-if="streamingText" class="streaming-box">
          <h3>AI 实时分析</h3>
          <div class="markdown-body" v-html="streamingHtml"></div>
        </div>
      </el-card>
    </div>
    <el-card class="history-card">
      <template #header>
        <div class="history-header">
          <span>历史分析记录</span>
          <el-button size="small" type="danger" plain @click="clearHistory">
            清空记录
          </el-button>
        </div>
      </template>
      <el-table :data="historyList" style="width: 100%">
        <el-table-column prop="job" label="岗位名称" />
        <el-table-column prop="match" label="匹配度" />
        <el-table-column prop="time" label="分析时间" />
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 32px;
  background: #f5f7fa;
}

h1 {
  margin-bottom: 24px;
  text-align: center;
}

.main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.left-card,
.right-card {
  min-height: 500px;
}

.button-row {
  display: flex;
  gap: 12px;
  margin-top: 20px;

  @media (max-width: 640px) {
    flex-direction: column;
  }
}

.analyze-btn {
  width: 100%;
  margin-left: 0;
}

.resume-label {
  margin: 24px 0 8px;
  text-align: left;
  font-weight: 600;
  color: #303133;
}

.result h3 {
  margin-top: 20px;
  margin-bottom: 8px;
}

.result p {
  line-height: 1.7;
  color: #444;
}

.history-card {
  margin-top: 24px;
}

.result {
  padding: 10px 20px;
  text-align: left;
}

.result h3 {
  margin-top: 22px;
  margin-bottom: 10px;
  text-align: center;
}

.result ul {
  padding-left: 24px;
  line-height: 1.8;
}

.score-box {
  margin-bottom: 20px;
}

.tag-box {
  margin-bottom: 20px;
}

.keyword-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.copy-btn {
  width: 100%;
  margin-top: 12px;
}

.streaming-box {
  margin-top: 20px;
  padding: 16px 20px;
  text-align: left;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fafafa;
}

.streaming-box h3 {
  margin-top: 12px;
  margin-bottom: 10px;
  text-align: center;
}

.markdown-body h2 {
  margin: 18px 0 10px;
  font-size: 18px;
}

.markdown-body ul {
  margin: 8px 0 12px;
  padding-left: 22px;
}

.markdown-body li {
  margin: 6px 0;
  line-height: 1.7;
}

.markdown-body p {
  margin: 8px 0;
  line-height: 1.7;
  color: #444;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
