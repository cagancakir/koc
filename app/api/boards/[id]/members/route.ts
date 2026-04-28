import { NextResponse } from "next/server";
import { BoardRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { canManage, canView, getBoardRole } from "@/lib/access";

const VALID_ROLES: BoardRole[] = [BoardRole.EDITOR, BoardRole.VIEWER];

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = await getBoardRole(userId, params.id);
  if (!canView(role)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const board = await prisma.board.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, email: true } },
      members: {
        include: { user: { select: { id: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    owner: { ...board.user, role: BoardRole.OWNER },
    members: board.members.map((m) => ({
      memberId: m.id,
      role: m.role,
      ...m.user,
    })),
  });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = await getBoardRole(userId, params.id);
  if (!canManage(role)) {
    return NextResponse.json(
      { error: role ? "Only the owner can manage members" : "Not found" },
      { status: role ? 403 : 404 },
    );
  }

  try {
    const { email, role: newRole } = await req.json();
    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    if (!VALID_ROLES.includes(newRole)) {
      return NextResponse.json(
        { error: "role must be EDITOR or VIEWER" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "No user with that email — they need to register first" },
        { status: 404 },
      );
    }

    const board = await prisma.board.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });
    if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (board.userId === user.id) {
      return NextResponse.json(
        { error: "Owner is already on the board" },
        { status: 400 },
      );
    }

    const member = await prisma.boardMember.upsert({
      where: { boardId_userId: { boardId: params.id, userId: user.id } },
      update: { role: newRole },
      create: { boardId: params.id, userId: user.id, role: newRole },
      include: { user: { select: { id: true, email: true } } },
    });
    return NextResponse.json(
      {
        memberId: member.id,
        role: member.role,
        id: member.user.id,
        email: member.user.email,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
