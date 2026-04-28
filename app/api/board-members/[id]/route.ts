import { NextResponse } from "next/server";
import { BoardRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { canManage, getBoardRole } from "@/lib/access";

const VALID_ROLES: BoardRole[] = [BoardRole.EDITOR, BoardRole.VIEWER];

async function authorize(userId: string, memberId: string) {
  const member = await prisma.boardMember.findUnique({
    where: { id: memberId },
    select: { boardId: true },
  });
  if (!member) return { ok: false as const, status: 404 };
  const role = await getBoardRole(userId, member.boardId);
  if (!canManage(role)) return { ok: false as const, status: role ? 403 : 404 };
  return { ok: true as const, boardId: member.boardId };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await authorize(userId, params.id);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  try {
    const { role } = await req.json();
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "role must be EDITOR or VIEWER" },
        { status: 400 },
      );
    }
    const member = await prisma.boardMember.update({
      where: { id: params.id },
      data: { role },
      include: { user: { select: { id: true, email: true } } },
    });
    return NextResponse.json({
      memberId: member.id,
      role: member.role,
      id: member.user.id,
      email: member.user.email,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await authorize(userId, params.id);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  await prisma.boardMember.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
