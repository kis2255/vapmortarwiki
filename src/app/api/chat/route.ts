import { NextRequest, NextResponse } from "next/server";
import { generateAnswer } from "@/lib/rag/generator";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages 배열이 필요합니다" }, { status: 400 });
    }

    const answer = await generateAnswer(messages);

    // 대화 저장
    try {
      let sid = sessionId;
      if (!sid) {
        const lastUserMsg = messages.findLast((m: { role: string }) => m.role === "user");
        const session = await prisma.chatSession.create({
          data: { title: lastUserMsg?.content?.slice(0, 50) || "새 대화" },
        });
        sid = session.id;
      }

      const lastUserMsg = messages[messages.length - 1];
      if (lastUserMsg?.role === "user") {
        await prisma.chatMessage.create({
          data: { sessionId: sid, role: "user", content: lastUserMsg.content },
        });
      }
      await prisma.chatMessage.create({
        data: {
          sessionId: sid,
          role: "assistant",
          content: answer.content,
          sources: answer.sources as unknown as undefined,
        },
      });

      return NextResponse.json({ ...answer, sessionId: sid });
    } catch {
      // 저장 실패해도 답변은 반환
      return NextResponse.json(answer);
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "답변 생성 중 오류가 발생했습니다" }, { status: 500 });
  }
}

// 대화 이력 조회
export async function GET() {
  const sessions = await prisma.chatSession.findMany({
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: {
      messages: { take: 1, orderBy: { createdAt: "asc" } },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(sessions);
}
