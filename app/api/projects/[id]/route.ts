import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      boards: {
        include: {
          columns: {
            orderBy: { order: "asc" },
            include: {
              cards: {
                orderBy: { order: "asc" },
                include: {
                  labels: true,
                  assignee: { select: { id: true, name: true, email: true, avatar: true } },
                  _count: { select: { comments: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const data = await req.json();

  const project = await prisma.project.update({
    where: { id },
    data: { name: data.name, description: data.description, color: data.color },
  });

  return NextResponse.json(project);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
