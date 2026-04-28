import { NextResponse } from "next/server";
import { LabelColor } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { canEdit, canView, getBoardRole } from "@/lib/access";

const COLORS = Object.values(LabelColor);

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = await getBoardRole(userId, params.id);
  if (!canView(role)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const labels = await prisma.label.findMany({
    where: { boardId: params.id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(labels);
}

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
    const { name, color } = await req.json();
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }
    const safeColor = COLORS.includes(color) ? (color as LabelColor) : LabelColor.INDIGO;
    const label = await prisma.label.create({
      data: { name: name.trim(), color: safeColor, boardId: params.id },
    });
    return NextResponse.json(label, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
