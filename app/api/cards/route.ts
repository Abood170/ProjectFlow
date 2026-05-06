import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, columnId, description, priority, dueDate, assigneeId } = await req.json();
  if (!title || !columnId) return NextResponse.json({ error: "Title and columnId required" }, { status: 400 });

  const maxOrder = await prisma.card.findFirst({
    where: { columnId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const card = await prisma.card.create({
    data: {
      title,
      description,
      columnId,
      priority: priority || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
      assigneeId,
      order: (maxOrder?.order ?? -1) + 1,
    },
    include: {
      labels: true,
      assignee: { select: { id: true, name: true, email: true, avatar: true } },
      _count: { select: { comments: true } },
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: `created card "${title}"`,
      entityId: card.id,
      entityType: "card",
      metadata: { cardTitle: title },
    },
  });

  if (assigneeId && assigneeId !== session.user.id) {
    await prisma.notification.create({
      data: { userId: assigneeId, message: `You were assigned to "${title}"`, type: "ASSIGNMENT" },
    });
  }

  return NextResponse.json(card, { status: 201 });
}
