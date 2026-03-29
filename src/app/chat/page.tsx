"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, FileText, Loader2, X, ExternalLink, Package, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Source {
  type: string;
  title: string;
  id?: string;
  slug?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface SourceDetail {
  type: string;
  id: string;
  title: string;
  slug?: string;
  content?: string;
}

const quickQuestions = [
  "보수몰탈 제품 목록 알려줘",
  "KS F 4042 기준은?",
  "RM-100과 Fosroc Renderoc 비교",
  "Saint-Gobain 건설화학 사업",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "안녕하세요! VAP 특수몰탈 AI 어시스턴트입니다.\n\n제품 물성, 시공방법, KS 규격, 시장 동향, 글로벌 경쟁사 분석 등 무엇이든 질문해 주세요.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<SourceDetail | null>(null);
  const [loadingSource, setLoadingSource] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(question?: string) {
    const text = question || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) throw new Error("API 요청 실패");
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.content,
          sources: data.sources,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "죄송합니다. 답변 생성 중 오류가 발생했습니다.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSourceClick(source: Source) {
    if (!source.id) return;
    setLoadingSource(true);

    try {
      // 출처 유형에 따라 다른 API 호출
      let url = "";
      if (source.type === "product") {
        url = `/api/products/${source.id}`;
      } else if (source.type === "article") {
        url = `/api/articles/${source.id}`;
      } else if (source.type === "document") {
        url = `/api/documents/${source.id}`;
      }

      if (url) {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setSelectedSource({
            type: source.type,
            id: source.id,
            title: source.title,
            slug: source.slug || data.slug,
            content: source.type === "product"
              ? formatProductDetail(data)
              : source.type === "document"
                ? formatDocumentDetail(data)
                : data.content?.slice(0, 1500) || data.excerpt || "",
          });
        } else {
          setSelectedSource({
            type: source.type,
            id: source.id,
            title: source.title,
            slug: source.slug,
            content: "상세 정보를 불러올 수 없습니다.",
          });
        }
      } else {
        setSelectedSource({
          type: source.type,
          id: source.id,
          title: source.title,
          slug: source.slug,
        });
      }
    } catch {
      setSelectedSource({
        type: source.type,
        id: source.id,
        title: source.title,
        content: "상세 정보를 불러올 수 없습니다.",
      });
    } finally {
      setLoadingSource(false);
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl gap-5">
      {/* 왼쪽: 채팅 영역 */}
      <div className={cn("flex flex-1 flex-col", selectedSource ? "max-w-[60%]" : "max-w-3xl mx-auto")}>
        <div className="mb-4">
          <h1 className="text-xl font-bold tracking-tight">AI 기술 질의응답</h1>
          <p className="text-sm text-[var(--color-muted)]">
            등록된 기술자료 기반으로 답변합니다
          </p>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 space-y-4 overflow-y-auto pb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1e40af] to-[#3b82f6] shadow-[0_0_12px_rgba(59,130,246,0.25)]">
                  <Bot size={16} className="text-white" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] text-sm",
                  msg.role === "user"
                    ? "rounded-2xl rounded-br-sm bg-[var(--color-primary)] px-4 py-3 text-white"
                    : "rounded-2xl rounded-bl-sm border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-[var(--shadow-sm)]"
                )}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 border-t border-[var(--color-border)] pt-3">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                      출처 (클릭하여 상세 보기)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((src, i) => (
                        <button
                          key={i}
                          onClick={() => handleSourceClick(src)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all hover:-translate-y-0.5",
                            selectedSource?.id === src.id
                              ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                              : "border-[var(--color-border)] bg-[var(--color-sidebar)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
                          )}
                        >
                          {src.type === "product" ? <Package size={11} /> : <FileText size={11} />}
                          {src.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-border)]">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1e40af] to-[#3b82f6]">
                <Bot size={16} className="text-white" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-muted)] shadow-[var(--shadow-sm)]">
                <Loader2 size={14} className="animate-spin" />
                자료를 검색하고 답변을 생성하고 있습니다...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 빠른 질문 */}
        {messages.length <= 1 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {quickQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSubmit(q)}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[13px] font-medium shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)] hover:shadow-[var(--shadow-md)]"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* 입력 영역 */}
        <div className="border-t border-[var(--color-border)] pt-4">
          <div className="flex items-center gap-2 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 shadow-[var(--shadow-md)] transition-colors focus-within:border-[var(--color-primary)] focus-within:shadow-[var(--shadow-md),0_0_0_3px_rgba(30,64,175,0.08)]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="질문을 입력하세요..."
              className="flex-1 bg-transparent py-1 text-sm outline-none"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-sm transition-opacity disabled:opacity-30"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 오른쪽: 출처 상세 패널 */}
      {selectedSource && (
        <div className="hidden w-[340px] shrink-0 flex-col lg:flex">
          <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
            {/* 패널 헤더 */}
            <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-sidebar)] px-4 py-3">
              <div className="flex items-center gap-2">
                {selectedSource.type === "product" ? (
                  <Package size={14} className="text-[var(--color-primary)]" />
                ) : (
                  <BookOpen size={14} className="text-[var(--color-primary)]" />
                )}
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                  {selectedSource.type === "product" ? "제품 정보" : "문서 출처"}
                </span>
              </div>
              <button
                onClick={() => setSelectedSource(null)}
                className="rounded-md p-1 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border)]"
              >
                <X size={14} />
              </button>
            </div>

            {/* 패널 타이틀 */}
            <div className="border-b border-[var(--color-border)] px-4 py-3">
              <h3 className="text-sm font-semibold">{selectedSource.title}</h3>
              <a
                href={
                  selectedSource.type === "product"
                    ? `/products/${selectedSource.id}`
                    : selectedSource.type === "document"
                      ? `/documents`
                      : `/wiki/${selectedSource.slug || selectedSource.id}`
                }
                className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--color-primary)] hover:underline"
              >
                <ExternalLink size={10} />
                전체 페이지 보기
              </a>
            </div>

            {/* 패널 본문 */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {loadingSource ? (
                <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                  <Loader2 size={14} className="animate-spin" />
                  로딩 중...
                </div>
              ) : selectedSource.content ? (
                <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--color-foreground)]">
                  {selectedSource.content}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-muted)]">
                  상세 정보가 없습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDocumentDetail(doc: {
  fileName: string;
  documentType: string;
  pageCount?: number;
  extractedText?: string;
  product?: { name: string; code: string } | null;
}): string {
  const lines: string[] = [];
  lines.push(`파일: ${doc.fileName}`);
  lines.push(`분류: ${doc.documentType}`);
  if (doc.pageCount) lines.push(`페이지: ${doc.pageCount}p`);
  if (doc.product) lines.push(`연결 제품: ${doc.product.name} (${doc.product.code})`);
  if (doc.extractedText) {
    lines.push("\n── 추출된 텍스트 (미리보기) ──");
    lines.push(doc.extractedText.slice(0, 1200));
    if (doc.extractedText.length > 1200) lines.push("...");
  }
  return lines.join("\n");
}

function formatProductDetail(product: {
  name: string;
  code: string;
  description?: string;
  usage?: string;
  scope?: string;
  mixRatio?: string;
  curing?: string;
  packaging?: string;
  category?: { name: string };
  properties?: { name: string; value: string; unit: string; standard?: string; passed: boolean }[];
  standards?: { standard: { code: string; name: string } }[];
}): string {
  const lines: string[] = [];

  lines.push(`${product.name} (${product.code})`);
  if (product.category) lines.push(`카테고리: ${product.category.name}`);
  if (product.description) lines.push(`\n${product.description}`);
  if (product.usage) lines.push(`\n용도: ${product.usage}`);
  if (product.scope) lines.push(`적용범위: ${product.scope}`);
  if (product.mixRatio) lines.push(`배합비: ${product.mixRatio}`);
  if (product.packaging) lines.push(`포장: ${product.packaging}`);
  if (product.curing) lines.push(`양생: ${product.curing}`);

  if (product.properties && product.properties.length > 0) {
    lines.push("\n── 물성 데이터 ──");
    for (const p of product.properties) {
      const std = p.standard ? ` (기준: ${p.standard})` : "";
      const verdict = p.passed ? "합격" : "불합격";
      lines.push(`${p.name}: ${p.value} ${p.unit}${std} → ${verdict}`);
    }
  }

  if (product.standards && product.standards.length > 0) {
    lines.push(`\n관련 규격: ${product.standards.map((s) => s.standard.code).join(", ")}`);
  }

  return lines.join("\n");
}
