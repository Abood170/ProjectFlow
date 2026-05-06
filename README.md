# ProjectFlow

A premium, full-stack project management tool — built with Next.js, TypeScript, and PostgreSQL. Manage projects with Kanban boards, track activity, search everything, and collaborate with your team in real time.

---

## Screenshot

![ProjectFlow Dashboard](public/screenshot.png)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL + Prisma v7 |
| Auth | NextAuth.js v5 |
| Drag & Drop | @dnd-kit/core |
| Charts | Recharts |
| Email | Nodemailer |

---

## Features

- **Kanban Boards** — Drag-and-drop cards across columns with smooth animations
- **Comments** — Threaded comments per card with emoji support and delete-own
- **Activity Timeline** — Per-card history and a global workspace activity feed
- **Global Search** — `⌘K` command palette searching cards, projects, and people
- **Dashboard** — Stats, completion charts, upcoming deadlines, quick actions
- **My Tasks** — All tasks assigned to you with overdue / due-soon filters
- **Team Management** — Invite members by email, role system (Owner / Admin / Member)
- **Notifications** — In-app notifications for assignments and due dates
- **Settings** — Profile photo upload, display name, password change
- **Dark / Light Mode** — System-aware theme with one-click toggle

---

## Installation

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud — [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app) all work)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/projectflow.git
cd projectflow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/projectflow"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"

# Google OAuth (optional — https://console.cloud.google.com)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# SMTP for password reset & invites
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="you@gmail.com"
SMTP_PASS="your-gmail-app-password"
```

### 4. Run database migrations

```bash
npx prisma migrate dev
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to the sign-in page.

---

## Project Structure

```
app/
  api/                  Route handlers (auth, cards, projects, search, activity…)
  (auth)/               Login, signup, forgot/reset password pages
  (dashboard)/          Protected app pages (dashboard, projects, my-tasks, activity…)
components/
  board/                KanbanBoard, KanbanColumn, KanbanCard, CardModal
  search/               CommandPalette, SearchProvider
  layout/               Sidebar
  ui/                   Button, Input, Modal, Avatar, Skeleton…
lib/
  auth.ts               NextAuth configuration
  prisma.ts             Prisma client singleton
  utils.ts              Helpers (cn, formatDate, formatRelativeDate…)
prisma/
  schema.prisma         Database schema
types/
  index.ts              Shared TypeScript types
```

---

## License

[MIT](LICENSE)
