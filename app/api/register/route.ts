import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@") || password.length < 6) {
      return NextResponse.json(
        { error: "Email must be valid and password at least 6 characters" },
        { status: 400 },
      );
    }
    const existing = await prisma.user.findUnique({ where: { email: normalized } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email: normalized, password: hashed },
      select: { id: true, email: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
