"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { useEffect, useState, useCallback } from "react";
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, Table as TableIcon, Minus, Undo, Redo,
  Plus, Trash2, Code,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

/** Markdown → HTML 변환 (TipTap 초기 로드용) */
function mdToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/^---$/gm, "<hr>")
    // 테이블 변환
    .replace(/(?:^|\n)((?:\|[^\n]+\|\n)+)/g, (_, tableBlock: string) => {
      const rows = tableBlock.trim().split("\n").filter((r: string) => r.trim());
      const dataRows = rows.filter((r: string) => !/^\|[\s\-:|]+\|$/.test(r));
      if (dataRows.length === 0) return tableBlock;
      let html = "<table>";
      dataRows.forEach((row: string, idx: number) => {
        const cells = row.split("|").filter((c: string) => c.trim() !== "");
        const tag = idx === 0 ? "th" : "td";
        html += idx === 0 ? "<tr>" : "<tr>";
        cells.forEach((cell: string) => { html += `<${tag}>${cell.trim()}</${tag}>`; });
        html += "</tr>";
      });
      html += "</table>";
      return html;
    })
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");
}

/** HTML → Markdown 변환 (저장용) */
function htmlToMd(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n")
    .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<em>(.*?)<\/em>/gi, "*$1*")
    .replace(/<hr\s*\/?>/gi, "\n---\n")
    .replace(/<ul>([\s\S]*?)<\/ul>/gi, (_, content: string) =>
      content.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    )
    .replace(/<ol>([\s\S]*?)<\/ol>/gi, (_, content: string) => {
      let i = 0;
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${++i}. ` + "$1\n");
    })
    // 테이블 변환
    .replace(/<table>([\s\S]*?)<\/table>/gi, (_, content: string) => {
      const rows: string[][] = [];
      content.replace(/<tr>([\s\S]*?)<\/tr>/gi, (__, rowContent: string) => {
        const cells: string[] = [];
        rowContent.replace(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi, (___, cell: string) => {
          cells.push(cell.replace(/<[^>]+>/g, "").trim());
          return "";
        });
        if (cells.length) rows.push(cells);
        return "";
      });
      if (rows.length === 0) return "";
      const colCount = rows[0].length;
      let md = "\n| " + rows[0].join(" | ") + " |\n";
      md += "|" + Array(colCount).fill("------").join("|") + "|\n";
      for (let i = 1; i < rows.length; i++) {
        md += "| " + rows[i].join(" | ") + " |\n";
      }
      return md;
    })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?p[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [inTable, setInTable] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checkTable = useCallback((e: any) => {
    if (e) setInTable(e.isActive("table"));
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: mdToHtml(value),
    onUpdate: ({ editor }) => {
      onChange(htmlToMd(editor.getHTML()));
      checkTable(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      checkTable(editor);
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none px-4 py-3 min-h-[400px] outline-none focus:outline-none",
      },
    },
  });

  // 외부 value 변경 시 에디터 동기화 (초기 로드)
  useEffect(() => {
    if (editor && !editor.isFocused) {
      const currentMd = htmlToMd(editor.getHTML());
      if (currentMd !== value && value) {
        editor.commands.setContent(mdToHtml(value));
      }
    }
  }, [value, editor]);

  if (!editor) return <div className="p-8 text-center text-[var(--color-muted)]">에디터 로딩 중...</div>;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--color-border)] bg-[var(--color-sidebar)] px-2 py-1.5">
        {/* 제목 */}
        <ToolBtn icon={Heading1} label="제목 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
        <ToolBtn icon={Heading2} label="제목 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <ToolBtn icon={Heading3} label="제목 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />

        <Divider />

        {/* 서식 */}
        <ToolBtn icon={Bold} label="굵게" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
        <ToolBtn icon={Italic} label="기울임" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <ToolBtn icon={Code} label="코드" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} />

        <Divider />

        {/* 목록 */}
        <ToolBtn icon={List} label="목록" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <ToolBtn icon={ListOrdered} label="번호목록" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <ToolBtn icon={Minus} label="구분선" onClick={() => editor.chain().focus().setHorizontalRule().run()} />

        <Divider />

        {/* 테이블 */}
        <ToolBtn icon={TableIcon} label="테이블 삽입"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
        <ToolBtn icon={Plus} label="열 추가" active={inTable}
          onClick={() => { if (inTable) editor.chain().focus().addColumnAfter().run(); }} />
        <ToolBtn icon={Plus} label="행 추가" active={inTable}
          onClick={() => { if (inTable) editor.chain().focus().addRowAfter().run(); }} />
        <ToolBtn icon={Trash2} label="테이블 삭제" active={inTable}
          onClick={() => { if (inTable) editor.chain().focus().deleteTable().run(); }} />

        <div className="ml-auto flex items-center gap-1">
          <ToolBtn icon={Undo} label="실행취소" onClick={() => editor.chain().focus().undo().run()} />
          <ToolBtn icon={Redo} label="다시실행" onClick={() => editor.chain().focus().redo().run()} />
        </div>
      </div>

      {/* 에디터 본문 */}
      <EditorContent editor={editor} />

      {/* TipTap 테이블 스타일 */}
      <style jsx global>{`
        .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 12px 0;
        }
        .ProseMirror th, .ProseMirror td {
          border: 1px solid var(--color-border);
          padding: 6px 10px;
          font-size: 13px;
          min-width: 80px;
        }
        .ProseMirror th {
          background: var(--color-sidebar);
          font-weight: 600;
          text-align: left;
        }
        .ProseMirror h1 { font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 0.5rem; }
        .ProseMirror h2 { font-size: 1.2rem; font-weight: 600; margin: 1.2rem 0 0.4rem; border-bottom: 1px solid var(--color-border); padding-bottom: 4px; }
        .ProseMirror h3 { font-size: 1rem; font-weight: 600; margin: 1rem 0 0.3rem; }
        .ProseMirror ul { list-style: disc; padding-left: 1.5rem; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; }
        .ProseMirror li { margin: 2px 0; }
        .ProseMirror hr { border-top: 1px solid var(--color-border); margin: 16px 0; }
        .ProseMirror p { margin: 4px 0; font-size: 14px; line-height: 1.6; }
        .ProseMirror .selectedCell { background: rgba(30, 64, 175, 0.08); }
      `}</style>
    </div>
  );
}

function ToolBtn({ icon: Icon, label, active, onClick }: {
  icon: React.ComponentType<{ size: number }>;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={cn(
        "rounded-md p-1.5 transition-colors",
        active
          ? "bg-[var(--color-primary)] text-white"
          : "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
      )}
    >
      <Icon size={15} />
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-[var(--color-border)]" />;
}
