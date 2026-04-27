import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const boards = await prisma.board.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true },
  });
  return NextResponse.json(boards);
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { title } = await req.json();
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }
    const board = await prisma.board.create({
      data: { title: title.trim(), userId },
      select: { id: true, title: true, createdAt: true },
    });
    return NextResponse.json(board, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
