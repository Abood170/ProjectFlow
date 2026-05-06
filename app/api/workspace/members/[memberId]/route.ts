import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { memberId } = await params;
  const { role } = await req.json();

  const requester = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } },
  });
  if (!requester) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const updated = await prisma.workspaceMember.update({
    where: { id: memberId },
    data: { role },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { memberId } = await params;

  const requester = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } },
  });
  if (!requester) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  await prisma.workspaceMember.delete({ where: { id: memberId } });
  return NextResponse.json({ ok: true });
}
