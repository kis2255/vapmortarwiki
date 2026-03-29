"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Source {
  type: string;
  title: string;
  id?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

const quickQuestions = [
  "보수몰탈 제품 목록 알려줘",
  "KS F 4042 기준은?",
  "방수몰탈 시공 방법",
  "국내 보수보강 시장 전망",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "안녕하세요! VAP 특수몰탈 AI 어시스턴트입니다.\n\n제품 물성, 시공방법, KS 규격, 시장 동향 등 무엇이든 질문해 주세요. 등록된 기술자료를 기반으로 답변드립니다.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
          content: "죄송합니다. 답변을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <div className="mb-4">
        <h1 className="text-xl font-bold">AI 기술 질의응답</h1>
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
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-xl px-4 py-3 text-sm",
                msg.role === "user"
                  ? "bg-[var(--color-primary)] text-white"
                  : "border border-[var(--color-border)] bg-[var(--color-sidebar)]"
              )}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 border-t border-[var(--color-border)] pt-2">
                  <div className="mb-1 text-xs font-semibold text-[var(--color-muted)]">
                    출처:
                  </div>
                  {msg.sources.map((src, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
                      <FileText size={10} />
                      {src.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-border)]">
                <User size={16} />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]">
              <Bot size={16} className="text-white" />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-sidebar)] px-4 py-3 text-sm text-[var(--color-muted)]">
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
              className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs transition-colors hover:bg-[var(--color-sidebar)]"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* 입력 영역 */}
      <div className="flex gap-2 border-t border-[var(--color-border)] pt-4">
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
          className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-sidebar)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          disabled={isLoading}
        />
        <button
          onClick={() => handleSubmit()}
          disabled={!input.trim() || isLoading}
          className="flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 text-white disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
