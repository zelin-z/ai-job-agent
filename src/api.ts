import { promptV1, promptV2 } from "./prompts";
import type {
  AnalysisRequest,
  AnalysisResponseV1,
  AnalysisResponseV2,
  AnalysisServerResponse,
  AnalyzeMatchParams,
  AnalyzeMatchResult,
} from "./types/api";

const isStringArray = (value: unknown): value is string[] => {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
};

export const isValidResponse = (data: unknown): data is AnalysisResponseV2 => {
  if (!data || typeof data !== "object") {
    return false;
  }

  const candidate = data as Record<string, unknown>;

  return (
    typeof candidate.matchScore === "number" &&
    Number.isFinite(candidate.matchScore) &&
    candidate.matchScore >= 0 &&
    candidate.matchScore <= 100 &&
    isStringArray(candidate.matchedSkills) &&
    isStringArray(candidate.missingSkills) &&
    isStringArray(candidate.suggestions)
  );
};

const buildPrompt = (
  promptVersion: AnalysisRequest["promptVersion"],
  jd: string,
  resume: string,
) => {
  return promptVersion === "v2" ? promptV2(jd, resume) : promptV1(jd, resume);
};

export const apiCall = async <T>(
  url: string,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
};

const requestAnalyze = async ({
  apiBaseUrl,
  jd,
  resume,
  promptVersion,
}: AnalyzeMatchParams): Promise<AnalysisServerResponse> => {
  const payload: AnalysisRequest = {
    jdText: jd,
    resumeText: resume,
    promptVersion,
    prompt: buildPrompt(promptVersion, jd, resume),
  };

  return apiCall<AnalysisServerResponse>(`${apiBaseUrl}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};

const normalizeListText = (value: string): string[] => {
  if (!value || value === "无") {
    return [];
  }

  return value
    .split(/[、,，;；]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseV1Response = (content: string): AnalysisResponseV2 => {
  const scoreMatch = content.match(/匹配分数[:：]\s*(\d{1,3})/);
  const matchedMatch = content.match(/已匹配技能[:：]\s*(.+)/);
  const missingMatch = content.match(/缺失技能[:：]\s*(.+)/);

  const suggestionBlock =
    content.split(/优化建议[:：]/)[1]?.trim() ||
    content.split("\n").slice(3).join("\n").trim();

  const suggestions = suggestionBlock
    .split("\n")
    .map((line) => line.replace(/^\d+[.)、]\s*/, "").trim())
    .filter(Boolean);

  const parsed: AnalysisResponseV2 = {
    matchScore: scoreMatch ? Number(scoreMatch[1]) : Number.NaN,
    matchedSkills: normalizeListText(matchedMatch?.[1]?.trim() || ""),
    missingSkills: normalizeListText(missingMatch?.[1]?.trim() || ""),
    suggestions,
  };

  if (!isValidResponse(parsed)) {
    throw new Error("Invalid v1 response");
  }

  return parsed;
};

const toAnalysisResponseV1 = (
  response: AnalysisServerResponse,
): AnalysisResponseV1 => {
  return {
    content: response.content,
    promptVersion: "v1",
    source: response.source,
  };
};

export const analyzeMatch = async (
  params: AnalyzeMatchParams,
): Promise<AnalyzeMatchResult> => {
  const primaryResponse = await requestAnalyze(params);

  if (params.promptVersion === "v2") {
    try {
      const parsed: unknown = JSON.parse(primaryResponse.content);

      if (isValidResponse(parsed)) {
        return {
          data: parsed,
          rawContent: primaryResponse.content,
          source: primaryResponse.source || "server",
          usedPromptVersion: "v2",
        };
      }
    } catch {
      // Fall through to v1 retry.
    }

    const fallbackResponse = await requestAnalyze({
      ...params,
      promptVersion: "v1",
    });
    const v1Response = toAnalysisResponseV1(fallbackResponse);

    return {
      data: parseV1Response(v1Response.content),
      rawContent: v1Response.content,
      source: v1Response.source || "server",
      usedPromptVersion: "v1",
      fallbackReason: "invalid_v2_response",
    };
  }

  const v1Response = toAnalysisResponseV1(primaryResponse);

  return {
    data: parseV1Response(v1Response.content),
    rawContent: v1Response.content,
    source: v1Response.source || "server",
    usedPromptVersion: "v1",
  };
};
