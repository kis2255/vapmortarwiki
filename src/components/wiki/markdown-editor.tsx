"use client";

import { useRef } from "react";
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, Table, Link as LinkIcon, Minus, Eye, Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  preview: boolean;
  onTogglePreview: () => void;
}

const toolbarGroups = [
  [
    { icon: Heading1, label: "제목 1", insert: (s: string) => `# ${s || "제목"}` },
    { icon: Heading2, label: "제목 2", insert: (s: string) => `## ${s || "소제목"}` },
    { icon: Heading3, label: "제목 3", insert: (s: string) => `### ${s || "소소제목"}` },
  ],
  [
    { icon: Bold, label: "굵게", insert: (s: string) => `**${s || "텍스트"}**` },
    { icon: Italic, label: "기울임", insert: (s: string) => `*${s || "텍스트"}*` },
    { icon: LinkIcon, label: "링크", insert: (s: string) => `[${s || "링크텍스트"}](URL)` },
  ],
  [
    { icon: List, label: "목록", insert: (s: string) => `- ${s || "항목"}` },
    { icon: ListOrdered, label: "번호 목록", insert: (s: string) => `1. ${s || "항목"}` },
    { icon: Minus, label: "구분선", insert: () => "\n---\n" },
  ],
  [
    {
      icon: Table,
      label: "테이블 삽입",
      insert: () =>
        "\n| 항목 | 값 | 단위 |\n|------|-----|------|\n| 압축강도 | 52.3 | MPa |\n| 휨강도 | 9.8 | MPa |\n",
    },
  ],
];

export function MarkdownEditor({ value, onChange, preview, onTogglePreview }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertAtCursor(insertFn: (selected: string) => string) {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const inserted = insertFn(selected);
    const newValue = value.slice(0, start) + inserted + value.slice(end);

    onChange(newValue);

    // 커서 위치 복원
    setTimeout(() => {
      el.focus();
      el.selectionStart = start + inserted.length;
      el.selectionEnd = start + inserted.length;
    }, 0);
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--color-border)] bg-[var(--color-sidebar)] px-2 py-1.5">
        {toolbarGroups.map((group, gi) => (
          <div key={gi} className="flex items-center">
            {gi > 0 && <div className="mx-1 h-5 w-px bg-[var(--color-border)]" />}
            {group.map((tool) => (
              <button
                key={tool.label}
                type="button"
                title={tool.label}
                onClick={() => insertAtCursor(tool.insert)}
                disabled={preview}
                className="rounded-md p-1.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)] disabled:opacity-30"
              >
                <tool.icon size={15} />
              </button>
            ))}
          </div>
        ))}

        <div className="ml-auto flex items-center">
          <button
            type="button"
            onClick={onTogglePreview}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
              preview
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
            )}
          >
            {preview ? <Edit3 size={13} /> : <Eye size={13} />}
            {preview ? "편집" : "미리보기"}
          </button>
        </div>
      </div>

      {/* 에디터/미리보기 */}
      {preview ? (
        <div className="min-h-[400px] p-5">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{value || "내용을 입력하세요..."}</div>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Markdown으로 작성하세요...

# 제목
## 소제목

**굵은 텍스트**, *기울임 텍스트*

- 목록 항목 1
- 목록 항목 2

| 항목 | 값 | 단위 |
|------|-----|------|
| 압축강도 | 52.3 | MPa |`}
          rows={22}
          className="w-full bg-transparent px-4 py-3 font-mono text-sm leading-relaxed outline-none"
        />
      )}
    </div>
  );
}
