import { Sidebar } from "@/components/layout/sidebar";
import { SearchProvider } from "@/components/search/search-provider";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <SearchProvider>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in-up">
          {children}
        </div>
      </main>
    </SearchProvider>
  );
}
