import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { BoardRole } from "@prisma/client";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const boards = await prisma.board.findMany({
    where: {
      OR: [{ userId }, { members: { some: { userId } } }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      userId: true,
      members: {
        where: { userId },
        select: { role: true },
      },
    },
  });
  return NextResponse.json(
    boards.map((b) => ({
      id: b.id,
      title: b.title,
      createdAt: b.createdAt,
      role: b.userId === userId ? BoardRole.OWNER : (b.members[0]?.role ?? null),
      isOwner: b.userId === userId,
    })),
  );
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
    return NextResponse.json(
      { ...board, role: BoardRole.OWNER, isOwner: true },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
