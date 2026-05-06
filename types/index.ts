import type {
  User,
  Workspace,
  Project,
  Board,
  Column,
  Card,
  Label,
  Notification,
  ActivityLog,
  WorkspaceMember,
} from "@/app/generated/prisma/client";

export type { WorkspaceMember };

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type NotificationType = "INFO" | "ASSIGNMENT" | "DUE_DATE" | "MENTION" | "INVITE";

export type UserWithWorkspaces = User & {
  workspaces: (WorkspaceMember & {
    workspace: Workspace;
  })[];
};

export type WorkspaceWithMembers = Workspace & {
  members: (WorkspaceMember & {
    user: Pick<User, "id" | "name" | "email" | "avatar">;
  })[];
  projects: Project[];
};

export type ProjectWithBoards = Project & {
  boards: Board[];
  _count?: { boards: number };
};

export type BoardWithColumns = Board & {
  columns: ColumnWithCards[];
};

export type ColumnWithCards = Column & {
  cards: CardWithDetails[];
};

export type CardWithDetails = Card & {
  labels: Label[];
  assignee: Pick<User, "id" | "name" | "email" | "avatar"> | null;
  _count?: { comments: number };
};

export type CommentWithUser = {
  id: string;
  content: string;
  cardId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, "id" | "name" | "avatar">;
};

export type NotificationWithUser = Notification;

export type ActivityLogWithUser = ActivityLog & {
  user: Pick<User, "id" | "name" | "avatar">;
};

export interface DashboardStats {
  totalProjects: number;
  totalCards: number;
  completedCards: number;
  overdueCards: number;
  upcomingDeadlines: CardWithDetails[];
  recentActivity: ActivityLogWithUser[];
  completionByDay: { date: string; count: number }[];
}
