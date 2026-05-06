import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cards = await prisma.card.findMany({
    where: { assigneeId: session.user.id },
    include: {
      labels: true,
      column: {
        include: {
          board: {
            include: {
              project: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  const result = cards.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    priority: c.priority,
    dueDate: c.dueDate,
    columnName: c.column.name,
    projectId: c.column.board.project.id,
    projectName: c.column.board.project.name,
    labels: c.labels,
  }));

  return NextResponse.json(result);
}
