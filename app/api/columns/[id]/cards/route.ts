import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { midpoint } from "@/lib/orderUtils";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { title, description } = await req.json();
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }
    const column = await prisma.column.findFirst({
      where: { id: params.id, board: { userId } },
      select: { id: true },
    });
    if (!column) return NextResponse.json({ error: "Column not found" }, { status: 404 });

    const last = await prisma.card.findFirst({
      where: { columnId: column.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const order = midpoint(last?.order ?? null, null);

    const card = await prisma.card.create({
      data: {
        title: title.trim(),
        description: typeof description === "string" ? description : null,
        order,
        columnId: column.id,
      },
    });
    return NextResponse.json(card, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
