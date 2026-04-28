import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { midpoint } from "@/lib/orderUtils";
import { canEdit, getBoardRole } from "@/lib/access";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = await getBoardRole(userId, params.id);
  if (!canEdit(role)) {
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

    const last = await prisma.column.findFirst({
      where: { boardId: params.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const order = midpoint(last?.order ?? null, null);

    const column = await prisma.column.create({
      data: { title: title.trim(), order, boardId: params.id },
      include: { cards: true },
    });
    return NextResponse.json(column, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
