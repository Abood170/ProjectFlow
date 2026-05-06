import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWorkspaceInviteEmail } from "@/lib/mail";
import { v4 as uuidv4 } from "uuid";
import { addDays } from "date-fns";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, role } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } },
    include: { workspace: true },
  });
  if (!member) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const token = uuidv4();
  await prisma.workspaceInvite.upsert({
    where: { email_workspaceId: { email, workspaceId: member.workspaceId } },
    update: { token, expiresAt: addDays(new Date(), 7), role: role || "MEMBER" },
    create: { email, workspaceId: member.workspaceId, token, role: role || "MEMBER", expiresAt: addDays(new Date(), 7) },
  });

  await sendWorkspaceInviteEmail(email, member.workspace.name, session.user.name || "Someone", token);
  return NextResponse.json({ ok: true });
}
