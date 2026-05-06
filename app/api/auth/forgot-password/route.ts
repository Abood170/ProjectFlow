import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";
import { v4 as uuidv4 } from "uuid";
import { addHours } from "date-fns";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    // Always return 200 to avoid email enumeration
    if (!user) return NextResponse.json({ ok: true });

    const token = uuidv4();
    await prisma.verificationToken.upsert({
      where: { token },
      update: { expires: addHours(new Date(), 1) },
      create: {
        identifier: email,
        token,
        expires: addHours(new Date(), 1),
      },
    });

    await sendPasswordResetEmail(email, token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
