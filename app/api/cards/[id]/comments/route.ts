import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: cardId } = await params;

  const comments = await prisma.comment.findMany({
    where: { cardId },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: cardId } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const [comment, card] = await Promise.all([
    prisma.comment.create({
      data: { content: content.trim(), cardId, userId: session.user.id },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    }),
    prisma.card.findUnique({ where: { id: cardId }, select: { title: true } }),
  ]);

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "added a comment",
      entityId: cardId,
      entityType: "card",
      metadata: { cardTitle: card?.title },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
