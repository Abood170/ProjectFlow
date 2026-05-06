import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { addDays, subDays } from "date-fns";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.label.deleteMany();
  await prisma.card.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();
  await prisma.project.deleteMany();
  await prisma.workspaceInvite.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ──────────────────────────────────────────────────────────────
  const seedPassword = await bcrypt.hash(process.env.SEED_PASSWORD ?? "changeme", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Alice Admin",
      email: process.env.SEED_ADMIN_EMAIL ?? "alice@example.com",
      password: seedPassword,
    },
  });

  const member1 = await prisma.user.create({
    data: {
      name: "Bob Builder",
      email: "bob@example.com",
      password: seedPassword,
    },
  });

  const member2 = await prisma.user.create({
    data: {
      name: "Carol Designer",
      email: "carol@example.com",
      password: seedPassword,
    },
  });

  console.log("✅ Created 3 users");

  // ── Workspace ──────────────────────────────────────────────────────────
  const workspace = await prisma.workspace.create({
    data: {
      name: "My Workspace",
      slug: "my-workspace",
      description: "Sample workspace with project data",
      ownerId: admin.id,
    },
  });

  await prisma.workspaceMember.createMany({
    data: [
      { userId: admin.id,   workspaceId: workspace.id, role: "OWNER"  },
      { userId: member1.id, workspaceId: workspace.id, role: "ADMIN"  },
      { userId: member2.id, workspaceId: workspace.id, role: "MEMBER" },
    ],
  });

  console.log("✅ Created workspace with 3 members");

  // ── Project 1: Website Redesign ────────────────────────────────────────
  const project1 = await prisma.project.create({
    data: {
      name: "Website Redesign",
      description: "Modernize the company website with a fresh look and improved UX",
      color: "#6366f1",
      workspaceId: workspace.id,
    },
  });

  const board1 = await prisma.board.create({
    data: { name: "Main Board", projectId: project1.id },
  });

  const [todo1, inProgress1, done1] = await Promise.all([
    prisma.column.create({ data: { name: "To Do",        order: 0, boardId: board1.id, color: "#64748b" } }),
    prisma.column.create({ data: { name: "In Progress",  order: 1, boardId: board1.id, color: "#6366f1" } }),
    prisma.column.create({ data: { name: "Done",         order: 2, boardId: board1.id, color: "#22c55e" } }),
  ]);

  // To Do cards
  const card1 = await prisma.card.create({
    data: {
      title: "Design new homepage mockup",
      description: "Create wireframes and high-fidelity mockups for the new homepage layout",
      order: 0, columnId: todo1.id, priority: "HIGH",
      dueDate: addDays(new Date(), 5),
      assigneeId: member2.id,
    },
  });
  await prisma.label.create({ data: { name: "Design", color: "#a855f7", cardId: card1.id } });

  const card2 = await prisma.card.create({
    data: {
      title: "Set up analytics tracking",
      description: "Integrate Google Analytics 4 and define conversion goals",
      order: 1, columnId: todo1.id, priority: "MEDIUM",
      dueDate: addDays(new Date(), 10),
      assigneeId: member1.id,
    },
  });
  await prisma.label.create({ data: { name: "Analytics", color: "#f97316", cardId: card2.id } });

  const card3 = await prisma.card.create({
    data: {
      title: "Write SEO meta tags for all pages",
      order: 2, columnId: todo1.id, priority: "LOW",
      dueDate: addDays(new Date(), 14),
    },
  });

  // In Progress cards
  const card4 = await prisma.card.create({
    data: {
      title: "Implement responsive navigation",
      description: "Build mobile-first nav with hamburger menu and dropdown support",
      order: 0, columnId: inProgress1.id, priority: "HIGH",
      dueDate: addDays(new Date(), 2),
      assigneeId: member1.id,
    },
  });
  await prisma.label.createMany({
    data: [
      { name: "Frontend", color: "#06b6d4", cardId: card4.id },
      { name: "Urgent",   color: "#ef4444", cardId: card4.id },
    ],
  });

  const card5 = await prisma.card.create({
    data: {
      title: "Migrate CMS content to new structure",
      order: 1, columnId: inProgress1.id, priority: "MEDIUM",
      dueDate: addDays(new Date(), 3),
      assigneeId: admin.id,
    },
  });

  // Done cards
  const card6 = await prisma.card.create({
    data: {
      title: "Audit current website performance",
      description: "Run Lighthouse audits and document scores for Core Web Vitals",
      order: 0, columnId: done1.id, priority: "MEDIUM",
      assigneeId: admin.id,
    },
  });

  const card7 = await prisma.card.create({
    data: {
      title: "Define brand colour palette",
      order: 1, columnId: done1.id, priority: "LOW",
      assigneeId: member2.id,
    },
  });

  console.log("✅ Created Project 1 (Website Redesign) with 7 cards");

  // ── Project 2: Mobile App MVP ──────────────────────────────────────────
  const project2 = await prisma.project.create({
    data: {
      name: "Mobile App MVP",
      description: "Build the first version of our iOS/Android app",
      color: "#22c55e",
      workspaceId: workspace.id,
    },
  });

  const board2 = await prisma.board.create({
    data: { name: "Main Board", projectId: project2.id },
  });

  const [todo2, inProgress2, review2, done2] = await Promise.all([
    prisma.column.create({ data: { name: "Backlog",      order: 0, boardId: board2.id, color: "#64748b" } }),
    prisma.column.create({ data: { name: "In Progress",  order: 1, boardId: board2.id, color: "#6366f1" } }),
    prisma.column.create({ data: { name: "In Review",    order: 2, boardId: board2.id, color: "#f97316" } }),
    prisma.column.create({ data: { name: "Done",         order: 3, boardId: board2.id, color: "#22c55e" } }),
  ]);

  // Backlog
  const card8 = await prisma.card.create({
    data: {
      title: "Design onboarding flow",
      description: "3-step onboarding to collect user preferences on first launch",
      order: 0, columnId: todo2.id, priority: "HIGH",
      dueDate: addDays(new Date(), 7),
      assigneeId: member2.id,
    },
  });
  await prisma.label.create({ data: { name: "UX", color: "#a855f7", cardId: card8.id } });

  await prisma.card.create({
    data: {
      title: "Push notification integration",
      order: 1, columnId: todo2.id, priority: "MEDIUM",
      dueDate: addDays(new Date(), 20),
    },
  });

  await prisma.card.create({
    data: {
      title: "Offline mode with local cache",
      order: 2, columnId: todo2.id, priority: "LOW",
    },
  });

  // In Progress
  const card11 = await prisma.card.create({
    data: {
      title: "User authentication screens",
      description: "Login, signup, and forgot password screens with form validation",
      order: 0, columnId: inProgress2.id, priority: "URGENT",
      dueDate: addDays(new Date(), 1),
      assigneeId: member1.id,
    },
  });
  await prisma.label.createMany({
    data: [
      { name: "Auth",     color: "#ef4444", cardId: card11.id },
      { name: "Frontend", color: "#06b6d4", cardId: card11.id },
    ],
  });

  await prisma.card.create({
    data: {
      title: "API client setup (Axios + interceptors)",
      order: 1, columnId: inProgress2.id, priority: "HIGH",
      dueDate: addDays(new Date(), 2),
      assigneeId: admin.id,
    },
  });

  // In Review
  const card13 = await prisma.card.create({
    data: {
      title: "App icon and splash screen",
      order: 0, columnId: review2.id, priority: "MEDIUM",
      assigneeId: member2.id,
    },
  });
  await prisma.label.create({ data: { name: "Design", color: "#a855f7", cardId: card13.id } });

  // Done
  await prisma.card.create({
    data: {
      title: "Project setup (React Native + Expo)",
      order: 0, columnId: done2.id, priority: "HIGH",
      assigneeId: member1.id,
    },
  });

  await prisma.card.create({
    data: {
      title: "Define API contract (OpenAPI spec)",
      order: 1, columnId: done2.id, priority: "MEDIUM",
      assigneeId: admin.id,
    },
  });

  console.log("✅ Created Project 2 (Mobile App MVP) with 8 cards");

  // ── Comments ───────────────────────────────────────────────────────────
  await prisma.comment.createMany({
    data: [
      { content: "Started working on the wireframes, will share by EOD", cardId: card1.id, userId: member2.id },
      { content: "Looks good! Let's also add a dark mode variant", cardId: card1.id, userId: admin.id },
      { content: "Navigation is 80% done, just finishing the dropdown animations", cardId: card4.id, userId: member1.id },
      { content: "Auth screens are looking great! Minor padding fix needed on Android", cardId: card11.id, userId: admin.id },
    ],
  });

  console.log("✅ Created comments");

  // ── Notifications ──────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: admin.id,   message: 'Bob Builder was added to your workspace', type: "INVITE",     read: true  },
      { userId: admin.id,   message: 'Card "Implement responsive navigation" is due in 2 days', type: "DUE_DATE", read: false },
      { userId: member1.id, message: 'You were assigned to "User authentication screens"', type: "ASSIGNMENT", read: false },
      { userId: member1.id, message: 'You were assigned to "Set up analytics tracking"',  type: "ASSIGNMENT", read: true  },
      { userId: member2.id, message: 'You were assigned to "Design new homepage mockup"', type: "ASSIGNMENT", read: false },
      { userId: member2.id, message: 'Alice Admin commented on "Design new homepage mockup"', type: "MENTION", read: false },
    ],
  });

  console.log("✅ Created notifications");

  // ── Activity Logs ──────────────────────────────────────────────────────
  await prisma.activityLog.createMany({
    data: [
      { userId: admin.id,   action: 'created project "Website Redesign"',          entityId: project1.id, entityType: "project" },
      { userId: admin.id,   action: 'created project "Mobile App MVP"',             entityId: project2.id, entityType: "project" },
      { userId: member1.id, action: 'created card "Implement responsive navigation"', entityId: card4.id,  entityType: "card"    },
      { userId: member2.id, action: 'created card "Design new homepage mockup"',    entityId: card1.id,   entityType: "card"    },
      { userId: admin.id,   action: 'updated card "Migrate CMS content to new structure"', entityId: card5.id, entityType: "card" },
      { userId: member1.id, action: 'completed card "Project setup (React Native + Expo)"', entityId: card4.id, entityType: "card" },
    ],
  });

  console.log("✅ Created activity logs");

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
