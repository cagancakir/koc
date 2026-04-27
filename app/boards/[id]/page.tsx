import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BoardCanvas from "@/components/BoardCanvas";
import SignOutButton from "@/components/SignOutButton";
import { ChevronLeftIcon, LayersIcon } from "@/components/Icons";

export const dynamic = "force-dynamic";

export default async function BoardPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const board = await prisma.board.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      columns: {
        orderBy: { order: "asc" },
        include: { cards: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!board) notFound();

  return (
    <div className="h-screen flex flex-col">
      <header className="shrink-0 glass border-b border-slate-200/70">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/boards"
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-2 py-1 rounded-md text-sm transition"
            >
              <ChevronLeftIcon width={14} height={14} />
              <span>Boards</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="size-7 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white grid place-items-center shadow-sm shrink-0">
              <LayersIcon width={14} height={14} />
            </span>
            <h1 className="text-base font-semibold text-slate-900 truncate">
              {board.title}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500 hidden sm:inline">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <BoardCanvas
        boardId={board.id}
        initialColumns={board.columns.map((c) => ({
          id: c.id,
          title: c.title,
          order: c.order,
          boardId: c.boardId,
          cards: c.cards.map((card) => ({
            id: card.id,
            title: card.title,
            description: card.description,
            order: card.order,
            columnId: card.columnId,
          })),
        }))}
      />
    </div>
  );
}
