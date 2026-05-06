import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  return format(new Date(date), "MMM d, yyyy");
}

export function formatRelativeDate(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  return isBefore(new Date(date), new Date());
}

export function isDueSoon(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const dueDate = new Date(date);
  const soon = addDays(new Date(), 2);
  return isAfter(dueDate, new Date()) && isBefore(dueDate, soon);
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "URGENT": return "text-red-500 bg-red-50 dark:bg-red-950";
    case "HIGH":   return "text-orange-500 bg-orange-50 dark:bg-orange-950";
    case "MEDIUM": return "text-yellow-500 bg-yellow-50 dark:bg-yellow-950";
    case "LOW":    return "text-green-500 bg-green-50 dark:bg-green-950";
    default:       return "text-gray-500 bg-gray-50 dark:bg-gray-800";
  }
}

export function getPriorityBadgeColor(priority: string): string {
  switch (priority) {
    case "URGENT": return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    case "HIGH":   return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
    case "MEDIUM": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    case "LOW":    return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    default:       return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getAvatarColor(str: string): string {
  const colors = [
    "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500",
    "bg-lime-500", "bg-green-500", "bg-emerald-500", "bg-teal-500",
    "bg-cyan-500", "bg-sky-500", "bg-blue-500", "bg-indigo-500",
    "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", "bg-pink-500",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
