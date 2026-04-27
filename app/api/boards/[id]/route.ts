import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const board = await prisma.board.findFirst({
    where: { id: params.id, userId },
    include: {
      columns: {
        orderBy: { order: "asc" },
        include: {
          cards: { orderBy: { order: "asc" } },
        },
      },
    },
  });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(board);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const board = await prisma.board.findFirst({
    where: { id: params.id, userId },
    select: { id: true },
  });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.board.delete({ where: { id: board.id } });
  return NextResponse.json({ ok: true });
}
