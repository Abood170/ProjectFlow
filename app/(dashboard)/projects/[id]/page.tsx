import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KanbanBoard } from "@/components/board/kanban-board";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      boards: {
        include: {
          columns: {
            orderBy: { order: "asc" },
            include: {
              cards: {
                orderBy: { order: "asc" },
                include: {
                  labels: true,
                  assignee: { select: { id: true, name: true, email: true, avatar: true } },
                  _count: { select: { comments: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!project) notFound();

  const membersRaw = await prisma.workspaceMember.findMany({
    where: { workspaceId: project.workspaceId },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  const members = membersRaw.map((m) => ({ id: m.user.id, name: m.user.name, avatar: m.user.avatar }));
  const board = project.boards[0];

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <div
          className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
          style={{ background: `${project.color}20`, border: `1px solid ${project.color}40` }}
        >
          <div className="h-4 w-4 rounded-full shadow-[0_0_8px_2px_currentColor]" style={{ background: project.color, color: project.color }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{project.description}</p>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] bg-[var(--surface-2)] border border-[var(--border)] px-3 py-1.5 rounded-full font-medium">
            {board?.columns?.reduce((acc: number, col: any) => acc + col.cards.length, 0) ?? 0} cards
          </span>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--surface-2)] border border-[var(--border)] px-3 py-1.5 rounded-full font-medium">
            {board?.columns?.length ?? 0} columns
          </span>
        </div>
      </div>
      {board ? (
        <KanbanBoard board={board as any} members={members} />
      ) : (
        <div className="text-center py-16 text-[var(--text-muted)]">No board found for this project.</div>
      )}
    </div>
  );
}
