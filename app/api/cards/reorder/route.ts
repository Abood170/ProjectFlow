import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cardId, sourceColumnId, destColumnId, newOrder, affectedCards } = await req.json();

  await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: { columnId: destColumnId, order: newOrder },
    }),
    ...affectedCards.map(({ id, order }: { id: string; order: number }) =>
      prisma.card.update({ where: { id }, data: { order } })
    ),
  ]);

  return NextResponse.json({ ok: true });
}
