# ProjectFlow

> A premium, production-ready project management tool built with Next.js 16, TypeScript, and PostgreSQL.  
> Manage projects with Kanban boards, collaborate with your team, and track every activity in real time.

---

## Screenshot

![ProjectFlow Dashboard](public/screenshot.png)

---

## Features

| Feature | Details |
|---|---|
| **Kanban Boards** | Drag-and-drop cards across columns with smooth animations |
| **Global Search** | Cmd+K command palette — search cards, projects, and people instantly |
| **Comments** | Threaded per-card comments with emoji picker and delete-own support |
| **Activity Timeline** | Full per-card history + global workspace activity feed |
| **Dashboard** | Stats overview, completion charts, upcoming deadlines, quick actions |
| **My Tasks** | All cards assigned to you — filtered by overdue and due-soon |
| **Team Management** | Invite members by email, role system (Owner / Admin / Member) |
| **Notifications** | In-app bell notifications for assignments and due dates |
| **Settings** | Profile photo upload, display name change, password change |
| **Dark / Light Mode** | System-aware theme with one-click toggle |
| **Auth** | Email/password + Google OAuth, forgot/reset password via email |

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

## Requirements

- Node.js 18+
- PostgreSQL database — local or cloud ([Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app) all work)

---

## Installation

### 1. Extract and enter the folder

```bash
cd projectflow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set the required values:

```env
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/projectflow"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# Optional — Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Optional — Email (password reset + invites)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="you@gmail.com"
SMTP_PASS="your-gmail-app-password"
```

### 4. Run database migrations

```bash
npx prisma migrate deploy
```

### 5. (Optional) Seed sample data

```bash
npm run db:seed
```

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will land on the sign-up page.

---

## Deploying to Vercel

1. Push the project to a GitHub repository
2. Import it in [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.example` in the Vercel dashboard
4. Set `NEXTAUTH_URL` to your Vercel deployment URL (e.g. `https://projectflow.vercel.app`)
5. Run migrations against your cloud DB (Neon / Supabase) once before first deploy

Vercel will automatically run `prisma generate && next build` on every deploy.

---

## Project Structure

```
app/
  api/                  Route handlers (auth, cards, projects, search, activity, comments…)
  (auth)/               Login, signup, forgot-password, reset-password pages
  (dashboard)/          Protected pages — dashboard, projects, my-tasks, activity, settings…
components/
  board/                KanbanBoard, KanbanColumn, KanbanCard, CardModal
  search/               CommandPalette, SearchProvider
  layout/               Sidebar
  ui/                   Button, Input, Modal, Avatar, Skeleton, Badge…
lib/
  auth.ts               NextAuth configuration
  prisma.ts             Prisma client singleton
  utils.ts              Helpers (cn, formatDate, formatRelativeDate…)
prisma/
  schema.prisma         Database schema (13 models)
  seed.ts               Sample data seeder
  migrations/           SQL migration history
types/
  index.ts              Shared TypeScript types
```

---

## Support

If you have questions about installation or configuration, open an issue on GitHub or contact via the marketplace support channel.

---

## License

[MIT](LICENSE) — free to use in personal and commercial projects.
