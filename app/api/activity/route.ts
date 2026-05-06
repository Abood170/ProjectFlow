import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });
  if (!membership) return NextResponse.json([]);

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: membership.workspaceId },
    select: { userId: true },
  });
  const memberIds = members.map((m) => m.userId);

  const logs = await prisma.activityLog.findMany({
    where: { userId: { in: memberIds } },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(logs);
}
