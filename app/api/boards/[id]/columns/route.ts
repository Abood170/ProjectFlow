import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: boardId } = await params;
  const { name, color } = await req.json();

  const maxOrder = await prisma.column.findFirst({
    where: { boardId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const column = await prisma.column.create({
    data: { name, color: color || "#64748b", order: (maxOrder?.order ?? -1) + 1, boardId },
  });

  return NextResponse.json(column, { status: 201 });
}
