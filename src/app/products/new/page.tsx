"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

interface PropertyInput {
  name: string;
  unit: string;
  standard: string;
  value: string;
  testMethod: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState<PropertyInput[]>([
    { name: "", unit: "MPa", standard: "", value: "", testMethod: "KS F 2476" },
  ]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      code: formData.get("code"),
      name: formData.get("name"),
      categorySlug: formData.get("category"),
      description: formData.get("description"),
      usage: formData.get("usage"),
      scope: formData.get("scope"),
      mixRatio: formData.get("mixRatio"),
      method: formData.get("method"),
      curing: formData.get("curing"),
      packaging: formData.get("packaging"),
      properties: properties.filter((p) => p.name && p.value),
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/products/${data.id}`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/products"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft size={14} /> 제품 목록
      </Link>

      <h1 className="mb-6 text-xl font-bold">제품 등록</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <section className="rounded-xl border border-[var(--color-border)] p-4">
          <h2 className="mb-4 text-sm font-semibold">기본 정보</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="제품코드 *" name="code" placeholder="RM-100" required />
            <Field label="제품명 *" name="name" placeholder="VAP 보수몰탈 RM-100" required />
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">
                카테고리 *
              </label>
              <select
                name="category"
                required
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-sidebar)] px-3 py-2 text-sm"
              >
                <option value="">선택</option>
                <option value="repair-mortar">보수몰탈</option>
                <option value="waterproof-mortar">방수몰탈</option>
                <option value="floor-mortar">바닥몰탈</option>
                <option value="injection">주입재</option>
                <option value="grout">그라우트</option>
              </select>
            </div>
            <Field label="포장단위" name="packaging" placeholder="25kg/포" />
          </div>
          <div className="mt-4">
            <TextArea label="설명" name="description" placeholder="제품 설명" rows={2} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="용도" name="usage" placeholder="콘크리트 구조물 단면보수" />
            <Field label="배합비" name="mixRatio" placeholder="25kg : 4L" />
          </div>
        </section>

        {/* 적용범위 & 시공방법 */}
        <section className="rounded-xl border border-[var(--color-border)] p-4">
          <h2 className="mb-4 text-sm font-semibold">시공 정보</h2>
          <TextArea label="적용범위" name="scope" placeholder="교량, 터널, 건축물..." rows={2} />
          <div className="mt-4">
            <TextArea label="시공방법" name="method" placeholder="1. 하지처리&#10;2. 프라이머 도포&#10;3. 충전/미장&#10;4. 양생" rows={5} />
          </div>
          <div className="mt-4">
            <Field label="양생조건" name="curing" placeholder="습윤양생 3일 이상" />
          </div>
        </section>

        {/* 물성 데이터 */}
        <section className="rounded-xl border border-[var(--color-border)] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">물성 데이터</h2>
            <button
              type="button"
              onClick={() =>
                setProperties([
                  ...properties,
                  { name: "", unit: "MPa", standard: "", value: "", testMethod: "KS F 2476" },
                ])
              }
              className="flex items-center gap-1 text-xs text-[var(--color-primary)]"
            >
              <Plus size={12} /> 항목 추가
            </button>
          </div>

          <div className="space-y-3">
            {properties.map((prop, idx) => (
              <div key={idx} className="flex items-end gap-2">
                <div className="flex-1">
                  {idx === 0 && (
                    <label className="mb-1 block text-xs text-[var(--color-muted)]">시험항목</label>
                  )}
                  <input
                    value={prop.name}
                    onChange={(e) => {
                      const next = [...properties];
                      next[idx].name = e.target.value;
                      setProperties(next);
                    }}
                    placeholder="압축강도(28일)"
                    className="w-full rounded border border-[var(--color-border)] bg-[var(--color-sidebar)] px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="w-16">
                  {idx === 0 && (
                    <label className="mb-1 block text-xs text-[var(--color-muted)]">단위</label>
                  )}
                  <input
                    value={prop.unit}
                    onChange={(e) => {
                      const next = [...properties];
                      next[idx].unit = e.target.value;
                      setProperties(next);
                    }}
                    className="w-full rounded border border-[var(--color-border)] bg-[var(--color-sidebar)] px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="w-20">
                  {idx === 0 && (
                    <label className="mb-1 block text-xs text-[var(--color-muted)]">규격기준</label>
                  )}
                  <input
                    value={prop.standard}
                    onChange={(e) => {
                      const next = [...properties];
                      next[idx].standard = e.target.value;
                      setProperties(next);
                    }}
                    placeholder="≥40"
                    className="w-full rounded border border-[var(--color-border)] bg-[var(--color-sidebar)] px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="w-20">
                  {idx === 0 && (
                    <label className="mb-1 block text-xs text-[var(--color-muted)]">시험결과</label>
                  )}
                  <input
                    value={prop.value}
                    onChange={(e) => {
                      const next = [...properties];
                      next[idx].value = e.target.value;
                      setProperties(next);
                    }}
                    placeholder="52.3"
                    className="w-full rounded border border-[var(--color-border)] bg-[var(--color-sidebar)] px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="w-24">
                  {idx === 0 && (
                    <label className="mb-1 block text-xs text-[var(--color-muted)]">시험방법</label>
                  )}
                  <input
                    value={prop.testMethod}
                    onChange={(e) => {
                      const next = [...properties];
                      next[idx].testMethod = e.target.value;
                      setProperties(next);
                    }}
                    className="w-full rounded border border-[var(--color-border)] bg-[var(--color-sidebar)] px-2 py-1.5 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setProperties(properties.filter((_, i) => i !== idx))}
                  className="pb-1.5 text-[var(--color-muted)] hover:text-[var(--color-danger)]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Link
            href="/products"
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--color-primary)] px-6 py-2 text-sm text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {saving ? "저장 중..." : "제품 등록"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">
        {label}
      </label>
      <input
        name={name}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-sidebar)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  placeholder,
  rows = 3,
}: {
  label: string;
  name: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">
        {label}
      </label>
      <textarea
        name={name}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-sidebar)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
      />
    </div>
  );
}
