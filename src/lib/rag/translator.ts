/**
 * Gemini를 사용한 청크 번역 (영문/프랑스어 → 한국어)
 */

import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export async function translateChunk(text: string): Promise<string> {
  // 한국어가 이미 50% 이상이면 번역 불필요
  const koreanRatio = (text.match(/[가-힣]/g) || []).length / text.length;
  if (koreanRatio > 0.3) return text;

  // 너무 짧거나 숫자/기호만 있으면 번역 불필요
  if (text.length < 30) return text;

  try {
    const { text: translated } = await generateText({
      model: google("gemini-2.0-flash"),
      prompt: `다음 건설/특수몰탈 기술 문서를 한국어로 정확히 번역하세요.
기술 용어(MPa, EN 1504, ASTM 등)는 원문 그대로 유지하세요.
테이블 형식은 그대로 보존하세요.
번역만 출력하고 다른 설명은 하지 마세요.

원문:
${text}`,
      maxOutputTokens: 2000,
    });
    return translated || text;
  } catch {
    return text; // 번역 실패 시 원문 유지
  }
}

export async function translateChunks(
  chunks: string[],
  batchSize: number = 5
): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const translated = await Promise.all(batch.map(translateChunk));
    results.push(...translated);
  }

  return results;
}
