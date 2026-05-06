import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { token } = await params;

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: { workspace: { select: { id: true, name: true } } },
  });

  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite expired or invalid" }, { status: 400 });
  }

  if (invite.email !== session.user.email) {
    return NextResponse.json({ error: "This invite was sent to a different email" }, { status: 403 });
  }

  // Add as member
  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId: invite.workspaceId } },
    update: { role: invite.role },
    create: { userId: session.user.id, workspaceId: invite.workspaceId, role: invite.role },
  });

  // Clean up invite
  await prisma.workspaceInvite.delete({ where: { token } });

  return NextResponse.json({ workspaceName: invite.workspace.name });
}
