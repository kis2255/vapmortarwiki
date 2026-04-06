import { NextResponse } from "next/server";
import { fetchProjects, invalidateCache } from "@/lib/dashboard/asana-client";

export async function POST() {
  try {
    invalidateCache();
    const projects = await fetchProjects(true);
    return NextResponse.json({
      success: true,
      updated_at: new Date().toISOString(),
      project_count: projects.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
