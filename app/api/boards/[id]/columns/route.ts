import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { midpoint } from "@/lib/orderUtils";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { title } = await req.json();
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }
    const board = await prisma.board.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

    const last = await prisma.column.findFirst({
      where: { boardId: board.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const order = midpoint(last?.order ?? null, null);

    const column = await prisma.column.create({
      data: { title: title.trim(), order, boardId: board.id },
      include: { cards: true },
    });
    return NextResponse.json(column, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
