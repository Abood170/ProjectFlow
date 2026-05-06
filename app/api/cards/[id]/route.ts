import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const card = await prisma.card.findUnique({
    where: { id },
    include: {
      labels: true,
      assignee: { select: { id: true, name: true, email: true, avatar: true } },
      comments: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { comments: true } },
    },
  });

  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(card);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const data = await req.json();

  const existing = await prisma.card.findUnique({
    where: { id },
    select: { assigneeId: true, title: true, priority: true, dueDate: true, columnId: true, description: true },
  });

  const card = await prisma.card.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId || null }),
      ...(data.columnId !== undefined && { columnId: data.columnId }),
      ...(data.order !== undefined && { order: data.order }),
    },
    include: {
      labels: true,
      assignee: { select: { id: true, name: true, email: true, avatar: true } },
      _count: { select: { comments: true } },
    },
  });

  // Notify new assignee
  if (data.assigneeId && data.assigneeId !== existing?.assigneeId && data.assigneeId !== session.user.id) {
    await prisma.notification.create({
      data: { userId: data.assigneeId, message: `You were assigned to "${existing?.title}"`, type: "ASSIGNMENT" },
    });
  }

  // Build granular activity log entries
  const actions: string[] = [];

  if (data.title !== undefined && data.title !== existing?.title) {
    actions.push(`renamed card to "${data.title}"`);
  }
  if (data.description !== undefined && data.description !== existing?.description) {
    actions.push("updated description");
  }
  if (data.priority !== undefined && data.priority !== existing?.priority) {
    actions.push(`changed priority to ${data.priority}`);
  }
  if (data.dueDate !== undefined) {
    const newDate = data.dueDate ? new Date(data.dueDate).toISOString().split("T")[0] : null;
    const oldDate = existing?.dueDate ? new Date(existing.dueDate).toISOString().split("T")[0] : null;
    if (newDate !== oldDate) {
      if (newDate) {
        const fmt = new Date(data.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        actions.push(`set due date to ${fmt}`);
      } else {
        actions.push("removed due date");
      }
    }
  }
  if (data.assigneeId !== undefined && data.assigneeId !== existing?.assigneeId) {
    if (data.assigneeId) {
      const assignee = await prisma.user.findUnique({ where: { id: data.assigneeId }, select: { name: true } });
      actions.push(`assigned to ${assignee?.name ?? "someone"}`);
    } else {
      actions.push("unassigned the card");
    }
  }
  if (data.columnId !== undefined && data.columnId !== existing?.columnId) {
    const [oldCol, newCol] = await Promise.all([
      existing?.columnId ? prisma.column.findUnique({ where: { id: existing.columnId }, select: { name: true } }) : null,
      prisma.column.findUnique({ where: { id: data.columnId }, select: { name: true } }),
    ]);
    actions.push(`moved from "${oldCol?.name ?? "?"}" to "${newCol?.name ?? "?"}"`);
  }

  const actionsToLog = actions.length > 0 ? actions : [`updated card "${card.title}"`];
  await Promise.all(
    actionsToLog.map((action) =>
      prisma.activityLog.create({
        data: { userId: session.user.id, action, entityId: id, entityType: "card", metadata: { cardTitle: card.title } },
      })
    )
  );

  return NextResponse.json(card);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const card = await prisma.card.findUnique({ where: { id }, select: { title: true } });
  await prisma.card.delete({ where: { id } });

  await prisma.activityLog.create({
    data: { userId: session.user.id, action: `deleted card "${card?.title}"`, entityId: id, entityType: "card" },
  });

  return NextResponse.json({ ok: true });
}
