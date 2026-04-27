import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BoardsList from "./BoardsList";
import SignOutButton from "@/components/SignOutButton";
import { LayersIcon } from "@/components/Icons";

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
      <header className="sticky top-0 z-10 glass border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/boards" className="flex items-center gap-2 group">
            <span className="size-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white grid place-items-center shadow-sm shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition">
              <LayersIcon width={16} height={16} />
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              TaskFlow
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500 hidden sm:inline">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Your boards</h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize work into boards, columns, and cards.
          </p>
        </div>
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
