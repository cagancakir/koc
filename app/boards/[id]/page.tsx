import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBoardRole, canView } from "@/lib/access";
import BoardCanvas from "@/components/BoardCanvas";
import SignOutButton from "@/components/SignOutButton";
import { ChevronLeftIcon, LayersIcon } from "@/components/Icons";

export const dynamic = "force-dynamic";

export default async function BoardPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const role = await getBoardRole(userId, params.id);
  if (!canView(role)) notFound();

  const board = await prisma.board.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, email: true } },
      labels: true,
      members: {
        include: { user: { select: { email: true } } },
      },
      columns: {
        orderBy: { order: "asc" },
        include: {
          cards: {
            orderBy: { order: "asc" },
            include: {
              labels: true,
              assignee: { select: { id: true, email: true } },
            },
          },
        },
      },
    },
  });
  if (!board) notFound();

  const initialMembers = [
    {
      memberId: null,
      id: board.user.id,
      email: board.user.email,
      role: "OWNER" as const,
    },
    ...board.members.map((m) => ({
      memberId: m.id,
      id: m.userId,
      email: m.user.email,
      role: m.role,
    })),
  ];

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
        role={role!}
        initialLabels={board.labels.map((l) => ({
          id: l.id,
          name: l.name,
          color: l.color as any,
        }))}
        initialMembers={initialMembers}
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
            dueDate: card.dueDate?.toISOString() ?? null,
            assigneeId: card.assigneeId,
            assignee: card.assignee ? { id: card.assignee.id, email: card.assignee.email } : null,
            labels: card.labels.map((l) => ({
              id: l.id,
              name: l.name,
              color: l.color as any,
            })),
          })),
        }))}
      />
    </div>
  );
}
