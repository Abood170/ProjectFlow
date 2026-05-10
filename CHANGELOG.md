# Changelog

All notable changes to ProjectFlow are documented here.

---

## [1.0.0] — 2026-05-10

### Initial Release

#### Core Features
- Kanban boards with drag-and-drop cards across columns (@dnd-kit)
- Per-card details: title, description, priority, due date, assignee, labels
- Card comments with emoji picker and delete-own support
- Per-card activity timeline and global workspace activity feed
- Cmd+K / Ctrl+K command palette searching cards, projects, and members
- Dashboard with stats, completion charts (Recharts), upcoming deadlines
- My Tasks page — all cards assigned to you with overdue/due-soon filters
- Team management — invite by email, Owner / Admin / Member roles
- In-app notifications for assignments and due dates
- Profile settings: display name, avatar upload, password change
- Dark / Light mode with system-aware default and one-click toggle

#### Auth
- Email + password sign-up / sign-in
- Google OAuth via NextAuth.js v5
- Forgot password / reset password flow (email via Nodemailer)
- Workspace invite links sent by email

#### Tech
- Next.js 16 App Router, TypeScript, Tailwind CSS v4
- PostgreSQL + Prisma v7 with PrismaPg adapter
- NextAuth.js v5 (beta) with JWT strategy and PrismaAdapter
- Vercel-ready out of the box
