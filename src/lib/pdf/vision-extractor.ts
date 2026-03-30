/**
 * PDF → Gemini Vision 분석
 * 페이지 단위로 이미지·그래프·표·텍스트를 통합 분석하여
 * 한국어 텍스트로 변환한다.
 */

export interface VisionPage {
  pageNumber: number;
  content: string;
  hasImages: boolean;
}

export interface VisionExtractResult {
  pages: VisionPage[];
  fullText: string;
  pageCount: number;
}

const VISION_MODEL = "gemini-2.0-flash";

const SYSTEM_PROMPT = `당신은 건설/특수몰탈 분야의 기술 문서 분석 전문가입니다.
PDF 문서의 각 페이지를 분석하여 모든 내용을 한국어로 상세히 추출하세요.

## 추출 규칙

### 텍스트
- 모든 텍스트를 빠짐없이 추출
- 영문/일문 내용은 한국어로 번역하되, 기술 용어(MPa, EN 1504, ASTM, pH 등)는 원문 유지
- 제품명, 브랜드명은 원문 유지

### 표(Table)
- 마크다운 테이블 형식으로 정확히 재현
- 수치, 단위, 시험방법 등 모든 셀 값 포함

### 그래프/차트
- 그래프 제목, 축 레이블, 범례를 명시
- 주요 데이터 포인트의 수치를 읽어서 기술
- 트렌드/경향을 한 문장으로 요약
- 예: "압축강도-재령 그래프: 3일 25MPa, 7일 38MPa, 28일 52MPa. 초기 강도 발현이 빠른 경향."

### 사진/이미지
- 시공 사진: 시공 단계, 사용 장비, 시공 부위를 설명
- 제품 사진: 포장 형태, 규격, 외관 설명
- 현미경/단면 사진: 관찰 결과와 의미 설명
- 도면: 치수, 구조, 주요 부위 설명

### 수식
- LaTeX 형식이 아닌 일반 텍스트로 표기
- 예: W/C = 0.45, σc = P/A

## 출력 형식
페이지별로 아래 형식을 사용하세요:

---PAGE 1---
[이미지 포함 여부: 있음/없음]

(해당 페이지의 모든 내용)

---PAGE 2---
[이미지 포함 여부: 있음/없음]

(해당 페이지의 모든 내용)

...`;

/**
 * PDF 전체를 Gemini Vision에 전송하여 페이지별 분석 결과를 받는다.
 * Gemini 2.0 Flash는 PDF를 직접 입력받을 수 있다.
 */
export async function extractWithVision(
  buffer: Buffer
): Promise<VisionExtractResult> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY not set");

  const base64 = buffer.toString("base64");
  const fileSizeMB = buffer.length / (1024 * 1024);

  // 20MB 이상이면 분할 처리 필요 (Gemini inline 제한)
  if (fileSizeMB > 20) {
    throw new Error(`PDF 크기 ${fileSizeMB.toFixed(1)}MB — 20MB 제한 초과`);
  }

  console.log(`[Vision] PDF 분석 시작 (${fileSizeMB.toFixed(1)}MB)`);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: base64,
                },
              },
              {
                text: SYSTEM_PROMPT,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 30000,
          temperature: 0.1,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini Vision API error: ${error}`);
  }

  const data = await response.json();
  const rawText =
    data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  if (!rawText) {
    throw new Error("Gemini Vision이 빈 응답을 반환했습니다");
  }

  // 페이지별 파싱
  const pages = parsePages(rawText);

  console.log(`[Vision] ${pages.length}페이지 분석 완료`);

  return {
    pages,
    fullText: pages.map((p) => p.content).join("\n\n"),
    pageCount: pages.length,
  };
}

/**
 * Gemini 응답을 페이지별로 파싱한다.
 */
function parsePages(raw: string): VisionPage[] {
  // ---PAGE N--- 패턴으로 분할
  const pagePattern = /---PAGE\s*(\d+)---/gi;
  const parts = raw.split(pagePattern);

  const pages: VisionPage[] = [];

  // parts[0]은 첫 구분자 앞 텍스트 (보통 비어있음)
  // parts[1] = 페이지번호, parts[2] = 내용, parts[3] = 페이지번호, parts[4] = 내용...
  for (let i = 1; i < parts.length; i += 2) {
    const pageNum = parseInt(parts[i], 10);
    const content = (parts[i + 1] || "").trim();

    if (!content) continue;

    const hasImages =
      /\[이미지 포함 여부:\s*있음\]/i.test(content) ||
      /그래프|차트|사진|이미지|그림|도면|figure|image|photo/i.test(content);

    // 메타 라인 제거 후 본문만 추출
    const cleanContent = content
      .replace(/\[이미지 포함 여부:\s*(있음|없음)\]\s*/gi, "")
      .trim();

    if (cleanContent.length > 10) {
      pages.push({
        pageNumber: pageNum,
        content: cleanContent,
        hasImages,
      });
    }
  }

  // 페이지 구분자가 없는 경우 (전체를 1페이지로)
  if (pages.length === 0 && raw.trim().length > 10) {
    pages.push({
      pageNumber: 1,
      content: raw.trim(),
      hasImages: /그래프|차트|사진|이미지|그림|도면|figure|image|photo/i.test(raw),
    });
  }

  return pages;
}
