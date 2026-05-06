import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const slug = generateSlug(`${name}-workspace`) + "-" + Date.now().toString(36);

    // Create user first
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    });

    // Create workspace + add user as OWNER member
    const workspace = await prisma.workspace.create({
      data: {
        name: `${name}'s Workspace`,
        slug,
        ownerId: user.id,
      },
    });

    await prisma.workspaceMember.create({
      data: { userId: user.id, workspaceId: workspace.id, role: "OWNER" },
    });

    return NextResponse.json({ id: user.id, email: user.email });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
