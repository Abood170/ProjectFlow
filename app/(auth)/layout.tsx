import { Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden gradient-purple items-center justify-center p-12">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-black/20 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-48 w-48 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10 text-white max-w-sm">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold">ProjectFlow</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Manage projects <br />with clarity
          </h1>
          <p className="text-violet-200 text-lg leading-relaxed">
            Kanban boards, team collaboration, and real‑time progress — everything your team needs in one place.
          </p>
          {/* Feature list */}
          <div className="mt-10 space-y-3">
            {["Drag-and-drop Kanban boards", "Real-time team collaboration", "Priority tracking & deadlines", "Beautiful reports & insights"].map((f) => (
              <div key={f} className="flex items-center gap-3 text-violet-100 text-sm">
                <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-xl gradient-purple flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold gradient-purple-text">ProjectFlow</span>
        </div>

        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
