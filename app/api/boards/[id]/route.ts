import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { canManage, canView, getBoardRole } from "@/lib/access";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = await getBoardRole(userId, params.id);
  if (!canView(role)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const board = await prisma.board.findUnique({
    where: { id: params.id },
    include: {
      labels: { orderBy: { name: "asc" } },
      members: {
        include: { user: { select: { id: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      user: { select: { id: true, email: true } },
      columns: {
        orderBy: { order: "asc" },
        include: {
          cards: {
            orderBy: { order: "asc" },
            include: {
              labels: { select: { id: true, name: true, color: true } },
              assignee: { select: { id: true, email: true } },
            },
          },
        },
      },
    },
  });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...board, role });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = await getBoardRole(userId, params.id);
  if (!canManage(role)) {
    return NextResponse.json(
      { error: role ? "Forbidden" : "Not found" },
      { status: role ? 403 : 404 },
    );
  }
  try {
    const { title } = await req.json();
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }
    const board = await prisma.board.update({
      where: { id: params.id },
      data: { title: title.trim() },
      select: { id: true, title: true, createdAt: true },
    });
    return NextResponse.json(board);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = await getBoardRole(userId, params.id);
  if (!canManage(role)) {
    return NextResponse.json(
      { error: role ? "Forbidden" : "Not found" },
      { status: role ? 403 : 404 },
    );
  }
  await prisma.board.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
