/**
 * PDF 문서 자동 분류 (키워드 규칙 + AI)
 */

type DocumentType =
  | "TDS"
  | "MSDS"
  | "TEST_REPORT"
  | "CERTIFICATE"
  | "CASE_STUDY"
  | "CATALOG"
  | "TECHNICAL_PAPER"
  | "OTHER";

interface ClassificationRule {
  type: DocumentType;
  keywords: string[];
  weight: number;
}

const rules: ClassificationRule[] = [
  {
    type: "TDS",
    keywords: ["배합비", "시공방법", "양생", "물시멘트비", "혼화재", "적용범위", "시공순서", "사용량"],
    weight: 1,
  },
  {
    type: "MSDS",
    keywords: ["CAS번호", "CAS No", "노출기준", "유해성", "응급조치", "안전보건자료", "MSDS", "SDS", "화학물질"],
    weight: 1.2,
  },
  {
    type: "TEST_REPORT",
    keywords: ["시험결과", "시험일자", "압축강도", "휨강도", "부착강도", "시험성적", "KS F", "ASTM C", "시험기관"],
    weight: 1,
  },
  {
    type: "CERTIFICATE",
    keywords: ["인증번호", "유효기간", "적합판정", "인증기관", "인증서", "KS인증", "환경표지"],
    weight: 1.2,
  },
  {
    type: "CASE_STUDY",
    keywords: ["시공일자", "현장명", "적용면적", "준공", "시공사례", "현장적용", "시공현장"],
    weight: 1,
  },
  {
    type: "CATALOG",
    keywords: ["제품라인업", "브랜드", "문의처", "카탈로그", "제품소개", "제품안내"],
    weight: 0.8,
  },
  {
    type: "TECHNICAL_PAPER",
    keywords: ["초록", "abstract", "참고문헌", "연구결과", "실험방법", "결론", "논문"],
    weight: 0.9,
  },
];

/** 키워드 규칙 기반 분류 */
export function classifyByKeywords(text: string): {
  type: DocumentType;
  confidence: number;
} {
  const lowerText = text.toLowerCase();
  const scores = new Map<DocumentType, number>();

  for (const rule of rules) {
    let matchCount = 0;
    for (const keyword of rule.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      const score = (matchCount / rule.keywords.length) * rule.weight;
      scores.set(rule.type, (scores.get(rule.type) || 0) + score);
    }
  }

  if (scores.size === 0) {
    return { type: "OTHER", confidence: 0 };
  }

  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const [bestType, bestScore] = sorted[0];
  const confidence = Math.min(bestScore, 1);

  return { type: bestType, confidence };
}

/** 파일명 기반 분류 (보조) */
export function classifyByFilename(filename: string): DocumentType | null {
  const lower = filename.toLowerCase();
  if (lower.includes("tds")) return "TDS";
  if (lower.includes("msds") || lower.includes("sds")) return "MSDS";
  if (lower.includes("시험") || lower.includes("test")) return "TEST_REPORT";
  if (lower.includes("인증") || lower.includes("cert")) return "CERTIFICATE";
  if (lower.includes("시공") || lower.includes("case")) return "CASE_STUDY";
  if (lower.includes("카탈") || lower.includes("catalog")) return "CATALOG";
  return null;
}

/** 종합 분류 (파일명 + 텍스트 키워드) */
export function classifyDocument(
  filename: string,
  text: string
): { type: DocumentType; confidence: number; method: "filename" | "keyword" | "unknown" } {
  // 1. 파일명 체크 (높은 신뢰도)
  const filenameType = classifyByFilename(filename);
  if (filenameType) {
    return { type: filenameType, confidence: 0.8, method: "filename" };
  }

  // 2. 텍스트 키워드 분석
  const keywordResult = classifyByKeywords(text);
  if (keywordResult.confidence > 0.3) {
    return { ...keywordResult, method: "keyword" };
  }

  return { type: "OTHER", confidence: 0, method: "unknown" };
}
