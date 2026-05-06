import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ cards: [], projects: [], members: [] });

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });
  if (!membership) return NextResponse.json({ cards: [], projects: [], members: [] });
  const { workspaceId } = membership;

  const [rawCards, projects, rawMembers] = await Promise.all([
    prisma.card.findMany({
      where: {
        title: { contains: q, mode: "insensitive" },
        column: { board: { project: { workspaceId } } },
      },
      select: {
        id: true,
        title: true,
        priority: true,
        column: {
          select: {
            name: true,
            board: { select: { project: { select: { id: true, name: true, color: true } } } },
          },
        },
      },
      take: 8,
    }),
    prisma.project.findMany({
      where: { name: { contains: q, mode: "insensitive" }, workspaceId },
      select: { id: true, name: true, color: true, description: true },
      take: 5,
    }),
    prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        user: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
      },
      select: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    cards: rawCards.map((c) => ({
      id: c.id,
      title: c.title,
      priority: c.priority,
      columnName: c.column.name,
      projectName: c.column.board.project.name,
      projectId: c.column.board.project.id,
      projectColor: c.column.board.project.color,
    })),
    projects,
    members: rawMembers.map((m) => m.user),
  });
}
