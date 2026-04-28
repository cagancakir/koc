import { NextResponse } from "next/server";
import { LabelColor } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { canEdit, getBoardIdForLabel, getBoardRole } from "@/lib/access";

const COLORS = Object.values(LabelColor);

async function authorize(userId: string, labelId: string) {
  const boardId = await getBoardIdForLabel(labelId);
  if (!boardId) return { ok: false as const, status: 404 };
  const role = await getBoardRole(userId, boardId);
  if (!canEdit(role)) return { ok: false as const, status: role ? 403 : 404 };
  return { ok: true as const };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await authorize(userId, params.id);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  try {
    const body = await req.json();
    const data: { name?: string; color?: LabelColor } = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (COLORS.includes(body.color)) data.color = body.color as LabelColor;

    const label = await prisma.label.update({ where: { id: params.id }, data });
    return NextResponse.json(label);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await authorize(userId, params.id);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  await prisma.label.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
