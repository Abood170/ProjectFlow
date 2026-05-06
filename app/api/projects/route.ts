import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });
  if (!member) return NextResponse.json([]);

  const projects = await prisma.project.findMany({
    where: { workspaceId: member.workspaceId },
    include: {
      boards: {
        include: {
          columns: {
            include: { _count: { select: { cards: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, color } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });
  if (!member) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      name,
      description,
      color: color || "#6366f1",
      workspaceId: member.workspaceId,
      boards: {
        create: {
          name: "Main Board",
          columns: {
            create: [
              { name: "To Do", order: 0, color: "#64748b" },
              { name: "In Progress", order: 1, color: "#6366f1" },
              { name: "Done", order: 2, color: "#22c55e" },
            ],
          },
        },
      },
    },
    include: { boards: true },
  });

  await prisma.activityLog.create({
    data: { userId: session.user.id, action: `created project "${name}"`, entityId: project.id, entityType: "project" },
  });

  return NextResponse.json(project, { status: 201 });
}
