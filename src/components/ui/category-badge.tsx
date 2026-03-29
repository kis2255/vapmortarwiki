import { cn } from "@/lib/utils";

const categoryColors: Record<string, { bg: string; text: string; dot: string }> = {
  "repair-mortar": { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" },
  "waterproof-mortar": { bg: "bg-cyan-100", text: "text-cyan-800", dot: "bg-cyan-500" },
  "floor-mortar": { bg: "bg-violet-100", text: "text-violet-800", dot: "bg-violet-500" },
  injection: { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  grout: { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
  tile: { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500" },
  "market-analysis": { bg: "bg-rose-100", text: "text-rose-800", dot: "bg-rose-500" },
  "international-standards": { bg: "bg-indigo-100", text: "text-indigo-800", dot: "bg-indigo-500" },
};

export function CategoryBadge({
  name,
  slug,
  size = "sm",
}: {
  name: string;
  slug?: string;
  size?: "sm" | "md";
}) {
  const colors = slug ? categoryColors[slug] : undefined;
  const padding = size === "md" ? "px-2.5 py-1" : "px-2 py-0.5";
  const fontSize = size === "md" ? "text-xs" : "text-[11px]";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        padding,
        fontSize,
        colors ? `${colors.bg} ${colors.text}` : "bg-gray-100 text-gray-700"
      )}
    >
      {colors && (
        <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
      )}
      {name}
    </span>
  );
}

export function CategoryDot({ slug }: { slug?: string }) {
  const colors = slug ? categoryColors[slug] : undefined;
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        colors?.dot || "bg-gray-400"
      )}
    />
  );
}
