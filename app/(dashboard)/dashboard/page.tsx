import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { isBefore, addDays, startOfWeek } from "date-fns";

async function getDashboardData(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    select: { workspaceId: true },
  });
  if (!membership) return null;

  const projects = await prisma.project.findMany({
    where: { workspaceId: membership.workspaceId },
    include: {
      boards: {
        include: {
          columns: {
            include: {
              cards: {
                include: {
                  labels: true,
                  assignee: { select: { id: true, name: true, avatar: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  const allCards = projects.flatMap((p) =>
    p.boards.flatMap((b) =>
      b.columns.flatMap((c) => c.cards.map((card) => ({ ...card, columnName: c.name })))
    )
  );

  const doneColumnIds = projects.flatMap((p) =>
    p.boards.flatMap((b) =>
      b.columns
        .filter((c) => c.name.toLowerCase().includes("done"))
        .map((c) => c.id)
    )
  );

  const completedCards = allCards.filter((c) => doneColumnIds.includes(c.columnId));
  const overdueCards = allCards.filter(
    (c) => c.dueDate && isBefore(new Date(c.dueDate), new Date()) && !doneColumnIds.includes(c.columnId)
  );
  const upcomingDeadlines = allCards
    .filter(
      (c) =>
        c.dueDate &&
        !isBefore(new Date(c.dueDate), new Date()) &&
        isBefore(new Date(c.dueDate), addDays(new Date(), 7))
    )
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const recentActivity = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  const weekStart = startOfWeek(new Date());
  const completionByDay = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const dayStr = day.toISOString().split("T")[0];
    return {
      date: dayStr,
      count: completedCards.filter(
        (c) => c.updatedAt && c.updatedAt.toISOString().startsWith(dayStr)
      ).length,
    };
  });

  return {
    totalProjects: projects.length,
    totalCards: allCards.length,
    completedCards: completedCards.length,
    overdueCards: overdueCards.length,
    upcomingDeadlines,
    recentActivity,
    completionByDay,
    projects,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const data = await getDashboardData(session.user.id);
  return <DashboardContent data={data} userName={session.user.name} />;
}
