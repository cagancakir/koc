import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BoardCanvas from "@/components/BoardCanvas";
import SignOutButton from "@/components/SignOutButton";

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
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/boards" className="text-slate-500 hover:text-slate-900 text-sm">
              ← Boards
            </Link>
            <span className="text-slate-300">/</span>
            <h1 className="text-lg font-semibold text-slate-900">{board.title}</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span>{session.user.email}</span>
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
