import { BoardRole } from "@prisma/client";
import { prisma } from "./prisma";

export type AccessRole = BoardRole | null;

/**
 * Returns the user's effective role on a board, or null if no access.
 * Owner is implicit (board.userId), members are explicit (BoardMember).
 */
export async function getBoardRole(
  userId: string,
  boardId: string,
): Promise<AccessRole> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: {
      userId: true,
      members: {
        where: { userId },
        select: { role: true },
      },
    },
  });
  if (!board) return null;
  if (board.userId === userId) return BoardRole.OWNER;
  return board.members[0]?.role ?? null;
}

/**
 * Find the boardId for a column with one query, used to gate column mutations.
 */
export async function getBoardIdForColumn(columnId: string): Promise<string | null> {
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    select: { boardId: true },
  });
  return column?.boardId ?? null;
}

export async function getBoardIdForCard(cardId: string): Promise<string | null> {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: { column: { select: { boardId: true } } },
  });
  return card?.column.boardId ?? null;
}

export async function getBoardIdForLabel(labelId: string): Promise<string | null> {
  const label = await prisma.label.findUnique({
    where: { id: labelId },
    select: { boardId: true },
  });
  return label?.boardId ?? null;
}

export function canView(role: AccessRole): boolean {
  return role !== null;
}

export function canEdit(role: AccessRole): boolean {
  return role === BoardRole.OWNER || role === BoardRole.EDITOR;
}

export function canManage(role: AccessRole): boolean {
  // Only owners can change board title, delete board, manage members.
  return role === BoardRole.OWNER;
}
