import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BoardsList from "./BoardsList";
import SignOutButton from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function BoardsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const boards = await prisma.board.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true },
  });

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/boards" className="text-xl font-bold text-slate-900">
            TaskFlow
          </Link>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span>{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Your boards</h1>
        <BoardsList
          initial={boards.map((b) => ({
            id: b.id,
            title: b.title,
            createdAt: b.createdAt.toISOString(),
          }))}
        />
      </main>
    </div>
  );
}
