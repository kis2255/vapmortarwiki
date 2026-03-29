import { NextRequest, NextResponse } from "next/server";
import { hybridSearch, lookupProductData } from "@/lib/rag/retriever";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  if (!query) return NextResponse.json({ error: "q parameter required" });

  const results: Record<string, unknown> = { query };

  try {
    const chunks = await hybridSearch(query, 8);
    results.hybridSearch = chunks.map((c) => ({
      id: c.id,
      score: c.score,
      source: c.source,
      contentPreview: c.content.slice(0, 100),
    }));
  } catch (e) {
    results.hybridSearchError = (e as Error).message;
  }

  try {
    const products = await lookupProductData(query);
    results.productLookup = products.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      category: p.category.name,
      propertyCount: p.properties.length,
    }));
  } catch (e) {
    results.productLookupError = (e as Error).message;
  }

  return NextResponse.json(results);
}
