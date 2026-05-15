import type { PromptVersion } from "../prompts";

export type AnalysisRequest = {
  jdText: string;
  resumeText: string;
  promptVersion: PromptVersion;
  prompt: string;
};

export type AnalysisResponseV2 = {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
};

export type AnalysisResponseV1 = {
  content: string;
  promptVersion: "v1";
  source?: string;
};

export type AnalysisServerResponse = {
  content: string;
  promptVersion: PromptVersion;
  source?: string;
};

export type AnalyzeMatchParams = {
  apiBaseUrl: string;
  jd: string;
  resume: string;
  promptVersion: PromptVersion;
};

export type AnalyzeMatchResult = {
  data: AnalysisResponseV2;
  rawContent: string;
  source: string;
  usedPromptVersion: PromptVersion;
  fallbackReason?: string;
};
