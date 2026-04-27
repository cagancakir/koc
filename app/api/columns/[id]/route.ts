import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const column = await prisma.column.findFirst({
      where: { id: params.id, board: { userId } },
      select: { id: true },
    });
    if (!column) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: { title?: string; order?: number } = {};
    if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
    if (typeof body.order === "number" && Number.isFinite(body.order)) data.order = body.order;

    const updated = await prisma.column.update({ where: { id: column.id }, data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const column = await prisma.column.findFirst({
    where: { id: params.id, board: { userId } },
    select: { id: true },
  });
  if (!column) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.column.delete({ where: { id: column.id } });
  return NextResponse.json({ ok: true });
}
