import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, avatar: true, createdAt: true },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, avatar, updateAvatar, currentPassword, newPassword } = await req.json();
  const updateData: Record<string, string | null> = {};

  if (typeof name === "string" && name.trim()) updateData.name = name.trim();
  // `updateAvatar` flag lets the client explicitly opt-in to touching the avatar field
  if (updateAvatar === true) updateData.avatar = avatar ?? null;

  if (newPassword) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.password) return NextResponse.json({ error: "No password set (OAuth user)" }, { status: 400 });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    updateData.password = await bcrypt.hash(newPassword, 12);
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { id: true, name: true, email: true, avatar: true },
  });

  return NextResponse.json(user);
}
