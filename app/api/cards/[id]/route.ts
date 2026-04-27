import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const card = await prisma.card.findFirst({
      where: { id: params.id, column: { board: { userId } } },
      select: { id: true },
    });
    if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: {
      title?: string;
      description?: string | null;
      order?: number;
      columnId?: string;
    } = {};
    if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
    if (body.description === null || typeof body.description === "string") {
      data.description = body.description;
    }
    if (typeof body.order === "number" && Number.isFinite(body.order)) data.order = body.order;
    if (typeof body.columnId === "string") {
      const target = await prisma.column.findFirst({
        where: { id: body.columnId, board: { userId } },
        select: { id: true },
      });
      if (!target) return NextResponse.json({ error: "Target column invalid" }, { status: 400 });
      data.columnId = target.id;
    }

    const updated = await prisma.card.update({ where: { id: card.id }, data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const card = await prisma.card.findFirst({
    where: { id: params.id, column: { board: { userId } } },
    select: { id: true },
  });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.card.delete({ where: { id: card.id } });
  return NextResponse.json({ ok: true });
}
