import { NextRequest, NextResponse } from "next/server";
import { generateAnswer } from "@/lib/rag/generator";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages 배열이 필요합니다" },
        { status: 400 }
      );
    }

    const answer = await generateAnswer(messages);

    return NextResponse.json(answer);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "답변 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
