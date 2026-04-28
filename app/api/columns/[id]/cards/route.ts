import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { midpoint } from "@/lib/orderUtils";
import { canEdit, getBoardIdForColumn, getBoardRole } from "@/lib/access";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const boardId = await getBoardIdForColumn(params.id);
  if (!boardId) return NextResponse.json({ error: "Column not found" }, { status: 404 });
  const role = await getBoardRole(userId, boardId);
  if (!canEdit(role)) {
    return NextResponse.json(
      { error: role ? "Forbidden" : "Not found" },
      { status: role ? 403 : 404 },
    );
  }

  try {
    const { title, description } = await req.json();
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    const last = await prisma.card.findFirst({
      where: { columnId: params.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const order = midpoint(last?.order ?? null, null);

    const card = await prisma.card.create({
      data: {
        title: title.trim(),
        description: typeof description === "string" ? description : null,
        order,
        columnId: params.id,
      },
      include: {
        labels: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, email: true } },
      },
    });
    return NextResponse.json(card, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
