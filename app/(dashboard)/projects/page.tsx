"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FolderKanban, MoreHorizontal, Trash2, ArrowRight, LayoutGrid } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PROJECT_COLORS = [
  "#7c3aed","#a855f7","#ec4899","#ef4444",
  "#f97316","#eab308","#22c55e","#06b6d4","#0ea5e9",
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: PROJECT_COLORS[0] });
  const [creating, setCreating] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => { setProjects(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  const createProject = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const project = await res.json();
        setProjects((prev) => [project, ...prev]);
        setCreateOpen(false);
        setForm({ name: "", description: "", color: PROJECT_COLORS[0] });
        toast.success("Project created");
      }
    } finally {
      setCreating(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project and all its data?")) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Project deleted");
    }
    setMenuId(null);
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Projects</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={15} /> New Project
        </Button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-[var(--border)] rounded-2xl">
          <div className="h-16 w-16 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4">
            <FolderKanban size={28} className="text-[var(--text-muted)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No projects yet</h2>
          <p className="text-[var(--text-muted)] text-sm mb-6">Create your first project to start managing tasks.</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={15} /> Create Project
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-violet-500/30 hover:-translate-y-1.5 transition-all duration-200"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{ boxShadow: `inset 0 0 30px rgba(124,58,237,0.04), 0 8px 32px rgba(0,0,0,0.16), 0 0 0 1px rgba(124,58,237,0.12)` }} />
              {/* Color accent bar */}
              <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${project.color}ee, ${project.color}44)` }} />

              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/projects/${project.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${project.color}22` }}>
                        <LayoutGrid size={15} style={{ color: project.color }} />
                      </div>
                      <h3 className="font-semibold text-[var(--text-primary)] hover:text-violet-400 transition-colors truncate">
                        {project.name}
                      </h3>
                    </div>
                    {project.description && (
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 ml-10">{project.description}</p>
                    )}
                  </Link>

                  <div className="relative shrink-0">
                    <button
                      onClick={() => setMenuId(menuId === project.id ? null : project.id)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                    {menuId === project.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
                        <div className="absolute right-0 top-8 z-20 w-36 bg-[var(--surface)] border border-[var(--border-strong)] rounded-xl shadow-lg overflow-hidden py-1">
                          <Link
                            href={`/projects/${project.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
                            onClick={() => setMenuId(null)}
                          >
                            <ArrowRight size={12} /> Open
                          </Link>
                          <button
                            onClick={() => deleteProject(project.id)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
                  <span className="text-xs text-[var(--text-muted)]">
                    {project.boards?.length ?? 0} board{project.boards?.length !== 1 ? "s" : ""}
                  </span>
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Open Board <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Project">
        <div className="space-y-4">
          <Input
            label="Project Name"
            placeholder="My awesome project"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") createProject(); }}
          />
          <Textarea
            label="Description (optional)"
            placeholder="What is this project about?"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Accent Color</label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  className={cn(
                    "h-7 w-7 rounded-full transition-transform",
                    form.color === c ? "scale-125 ring-2 ring-white/30 ring-offset-2 ring-offset-[var(--surface)]" : "hover:scale-110"
                  )}
                  style={{ background: c }}
                  onClick={() => setForm({ ...form, color: c })}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={createProject} loading={creating} className="flex-1">Create Project</Button>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
