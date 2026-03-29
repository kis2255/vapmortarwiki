/**
 * RAG 답변 생성: 검색된 컨텍스트 + Gemini LLM
 */

import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { hybridSearch, lookupProductData, type RetrievedChunk } from "./retriever";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface GeneratedAnswer {
  content: string;
  sources: { type: string; id: string; title: string }[];
}

const SYSTEM_PROMPT = `당신은 VAP 특수몰탈 기술 전문가입니다. 아래 규칙을 반드시 따르세요:

1. 제공된 Context 자료를 기반으로 답변하세요. Context에 관련 내용이 있으면 반드시 활용하세요.
2. Context에 직접적인 내용이 없더라도, 건설/몰탈/콘크리트/방수/보수/그라우트/주입/규격 관련 질문이면 전문 지식으로 답변하세요.
3. 물성 수치(압축강도, 휨강도 등)는 Context의 데이터를 정확히 인용하세요. 추측하지 마세요.
4. 답변에 근거가 되는 출처를 [출처: 문서명] 형태로 표시하세요.
5. KS 규격 기준값과 실측값을 비교할 때는 합격/불합격 여부를 명확히 표시하세요.
6. 한국어로 답변하세요.
7. "해당 분야는 답변 범위 밖입니다"는 요리, 여행, 연예 등 건설과 완전히 무관한 질문에만 사용하세요.
8. 제품 추천 질문에는 Context의 제품 데이터를 바탕으로 용도와 물성을 비교하며 추천하세요.
9. 개념 설명 질문에는 Context 자료와 전문 지식을 결합하여 상세히 답변하세요.`;

/** 질문 의도 분류 */
async function classifyIntent(
  query: string
): Promise<"LOOKUP" | "EXPLAIN" | "COMPARE" | "RECOMMEND" | "GENERAL"> {
  // 제품 코드가 포함되면 바로 LOOKUP
  const hasProductCode = /[A-Z]{1,3}-?\d{2,4}/i.test(query);
  const hasComparison = /비교|차이|vs|대비/.test(query);
  if (hasProductCode && hasComparison) return "COMPARE";
  if (hasProductCode) return "LOOKUP";

  // 추천 키워드
  if (/추천|적합|어떤.*제품|뭘.*써야/.test(query)) return "RECOMMEND";

  const { text } = await generateText({
    model: google("gemini-2.0-flash"),
    prompt: `다음 건설/특수몰탈 관련 질문의 의도를 분류하세요. 반드시 아래 중 하나만 답하세요:
- LOOKUP: 수치/데이터/제품 정보 조회 (강도, 규격, 배합비, 시공법 등)
- COMPARE: 제품이나 규격 비교
- RECOMMEND: 제품 추천
- EXPLAIN: 개념/기술 해설
- GENERAL: 기타

질문: "${query}"
의도:`,
    maxOutputTokens: 20,
  });

  const intent = text.trim().toUpperCase();
  if (["LOOKUP", "COMPARE", "RECOMMEND", "EXPLAIN"].includes(intent)) {
    return intent as "LOOKUP" | "COMPARE" | "RECOMMEND" | "EXPLAIN";
  }
  return "GENERAL";
}

/** 컨텍스트 조합 */
function buildContext(
  chunks: RetrievedChunk[],
  productData?: Awaited<ReturnType<typeof lookupProductData>>
): string {
  const parts: string[] = [];

  if (productData && productData.length > 0) {
    parts.push("=== 제품 데이터 (DB 직접 조회) ===");
    for (const p of productData) {
      parts.push(`\n제품: ${p.name} (${p.code})`);
      parts.push(`카테고리: ${p.category.name}`);
      if (p.description) parts.push(`설명: ${p.description}`);
      if (p.usage) parts.push(`용도: ${p.usage}`);
      if (p.scope) parts.push(`적용범위: ${p.scope}`);
      if (p.mixRatio) parts.push(`배합비: ${p.mixRatio}`);
      if (p.method) parts.push(`시공방법: ${p.method}`);
      if (p.curing) parts.push(`양생: ${p.curing}`);
      if (p.properties.length > 0) {
        parts.push("물성 데이터:");
        for (const prop of p.properties) {
          const std = prop.standard ? ` [기준: ${prop.standard}]` : "";
          const pass = prop.passed ? "합격" : "불합격";
          parts.push(
            `  - ${prop.name}: ${prop.value} ${prop.unit}${std} → ${pass}`
          );
        }
      }
      if (p.standards.length > 0) {
        parts.push(`관련 규격: ${p.standards.map((s) => `${s.standard.code} (${s.standard.name})`).join(", ")}`);
      }
    }
  }

  if (chunks.length > 0) {
    parts.push("\n=== 관련 문서 검색 결과 ===");
    for (const chunk of chunks) {
      parts.push(`\n[출처: ${chunk.source.title}]`);
      parts.push(chunk.content);
    }
  }

  return parts.join("\n");
}

export async function generateAnswer(
  messages: ChatMessage[]
): Promise<GeneratedAnswer> {
  const lastUserMessage = messages.findLast((m) => m.role === "user");
  if (!lastUserMessage) {
    return { content: "질문을 입력해 주세요.", sources: [] };
  }

  const query = lastUserMessage.content;

  // 1. 의도 분류
  const intent = await classifyIntent(query);

  // 2. 검색 (항상 제품 데이터도 함께 조회)
  const [chunks, productData] = await Promise.all([
    hybridSearch(query, 8),
    lookupProductData(query).catch(() => []),
  ]);

  // 3. 컨텍스트 조합
  const context = buildContext(chunks, productData);

  if (!context.trim()) {
    return {
      content: "등록된 자료에서 해당 내용을 찾을 수 없습니다. 더 구체적인 질문을 해주시거나, 관련 자료를 먼저 업로드해 주세요.",
      sources: [],
    };
  }

  // 4. LLM 답변 생성
  const { text } = await generateText({
    model: google("gemini-2.0-flash"),
    system: SYSTEM_PROMPT,
    messages: [
      ...messages.slice(0, -1).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      {
        role: "user",
        content: `Context:\n${context}\n\n질문: ${query}`,
      },
    ],
    maxOutputTokens: 2000,
  });

  // 5. 출처 정리 (slug 포함)
  const sources = [
    ...chunks.slice(0, 5).map((c) => ({
      type: c.source.type,
      id: c.source.id,
      title: c.source.title,
      slug: c.source.slug,
    })),
    ...(productData || []).map((p) => ({
      type: "product" as const,
      id: p.id,
      title: `${p.name} (${p.code})`,
      slug: undefined as string | undefined,
    })),
  ];

  const uniqueSources = sources.filter(
    (s, i, arr) => arr.findIndex((x) => x.id === s.id) === i
  );

  return { content: text, sources: uniqueSources };
}
