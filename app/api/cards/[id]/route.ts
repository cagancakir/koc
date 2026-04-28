import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { canEdit, getBoardIdForCard, getBoardRole } from "@/lib/access";

async function authorize(userId: string, cardId: string) {
  const boardId = await getBoardIdForCard(cardId);
  if (!boardId) return { ok: false as const, status: 404 };
  const role = await getBoardRole(userId, boardId);
  if (!canEdit(role)) return { ok: false as const, status: role ? 403 : 404 };
  return { ok: true as const, boardId };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await authorize(userId, params.id);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  try {
    const body = await req.json();

    const data: {
      title?: string;
      description?: string | null;
      order?: number;
      columnId?: string;
      dueDate?: Date | null;
      assigneeId?: string | null;
      labels?: { set: { id: string }[] };
    } = {};

    if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
    if (body.description === null || typeof body.description === "string") {
      data.description = body.description;
    }
    if (typeof body.order === "number" && Number.isFinite(body.order)) data.order = body.order;

    // Move to a different column — must be on the same board.
    if (typeof body.columnId === "string") {
      const target = await prisma.column.findUnique({
        where: { id: body.columnId },
        select: { boardId: true },
      });
      if (!target || target.boardId !== auth.boardId) {
        return NextResponse.json(
          { error: "Target column invalid" },
          { status: 400 },
        );
      }
      data.columnId = body.columnId;
    }

    // Due date: accept ISO string, null to clear.
    if (body.dueDate === null) {
      data.dueDate = null;
    } else if (typeof body.dueDate === "string") {
      const d = new Date(body.dueDate);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid dueDate" }, { status: 400 });
      }
      data.dueDate = d;
    }

    // Assignee: must be a board owner or member, or null to unassign.
    if (body.assigneeId === null) {
      data.assigneeId = null;
    } else if (typeof body.assigneeId === "string") {
      const valid = await isUserOnBoard(body.assigneeId, auth.boardId);
      if (!valid) {
        return NextResponse.json(
          { error: "Assignee must be a member of the board" },
          { status: 400 },
        );
      }
      data.assigneeId = body.assigneeId;
    }

    // Labels: full replacement of labels via labelIds (array). Only labels on the same board allowed.
    if (Array.isArray(body.labelIds)) {
      const ids: string[] = (body.labelIds as unknown[]).filter(
        (x): x is string => typeof x === "string",
      );
      if (ids.length > 0) {
        const labels = await prisma.label.findMany({
          where: { id: { in: ids }, boardId: auth.boardId },
          select: { id: true },
        });
        if (labels.length !== ids.length) {
          return NextResponse.json(
            { error: "One or more labels are not on this board" },
            { status: 400 },
          );
        }
      }
      data.labels = { set: ids.map((id) => ({ id })) };
    }

    const updated = await prisma.card.update({
      where: { id: params.id },
      data,
      include: {
        labels: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, email: true } },
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await authorize(userId, params.id);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  await prisma.card.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

async function isUserOnBoard(userId: string, boardId: string): Promise<boolean> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: {
      userId: true,
      members: { where: { userId }, select: { id: true } },
    },
  });
  if (!board) return false;
  return board.userId === userId || board.members.length > 0;
}
