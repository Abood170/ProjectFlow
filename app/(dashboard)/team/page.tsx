"use client";

import { useState, useEffect } from "react";
import { UserPlus, Crown, Shield, User, MoreHorizontal, Trash2, Mail, Users } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const ROLE_CONFIG: Record<string, { icon: React.ReactNode; cls: string }> = {
  OWNER: { icon: <Crown size={11} />,  cls: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  ADMIN: { icon: <Shield size={11} />, cls: "bg-violet-500/15 text-violet-400 border-violet-500/25" },
  MEMBER:{ icon: <User size={11} />,   cls: "bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]" },
};

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/workspace/members")
      .then((r) => r.json())
      .then((data) => { setMembers(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  const sendInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const res = await fetch("/api/workspace/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) {
        toast.success(`Invite sent to ${inviteEmail}`);
        setInviteOpen(false);
        setInviteEmail("");
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to send invite");
      }
    } finally {
      setInviting(false);
    }
  };

  const removeMember = async (memberId: string, name: string) => {
    if (!confirm(`Remove ${name} from the workspace?`)) return;
    const res = await fetch(`/api/workspace/members/${memberId}`, { method: "DELETE" });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success("Member removed");
    }
  };

  const changeRole = async (memberId: string, role: string) => {
    const res = await fetch(`/api/workspace/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role } : m));
      toast.success("Role updated");
      setMenuId(null);
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Team</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {members.length} member{members.length !== 1 ? "s" : ""} in your workspace
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus size={15} /> Invite Member
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-[72px] rounded-xl" />)}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[var(--border)] rounded-2xl">
          <div className="h-14 w-14 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-[var(--text-muted)]" />
          </div>
          <p className="text-[var(--text-primary)] font-semibold">No members yet</p>
          <p className="text-[var(--text-muted)] text-sm mt-1.5">Invite your team to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          {members.map((member, idx) => {
            const roleCfg = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.MEMBER;
            return (
              <div
                key={member.id}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 group hover:bg-[var(--surface-2)] transition-colors",
                  idx < members.length - 1 && "border-b border-[var(--border)]"
                )}
              >
                <Avatar name={member.user.name} src={member.user.avatar} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <p className="font-semibold text-[var(--text-primary)] text-sm">{member.user.name || "Unknown"}</p>
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide",
                      roleCfg.cls
                    )}>
                      {roleCfg.icon} {member.role}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                    <Mail size={11} /> {member.user.email}
                  </p>
                </div>
                <p className="text-xs text-[var(--text-muted)] hidden sm:block shrink-0">
                  Joined {formatDate(member.joinedAt)}
                </p>
                {member.role !== "OWNER" && (
                  <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setMenuId(menuId === member.id ? null : member.id)}
                      className="p-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                    {menuId === member.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
                        <div className="absolute right-0 top-10 z-20 w-44 bg-[var(--surface)] border border-[var(--border-strong)] rounded-xl shadow-lg overflow-hidden py-1">
                          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Change Role</p>
                          {["ADMIN", "MEMBER"].map((r) => (
                            <button
                              key={r}
                              onClick={() => changeRole(member.id, r)}
                              className={cn(
                                "flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-[var(--surface-2)] transition-colors",
                                member.role === r ? "text-violet-400 font-semibold" : "text-[var(--text-secondary)]"
                              )}
                            >
                              {ROLE_CONFIG[r].icon} {r}
                              {member.role === r && <span className="ml-auto text-violet-400">✓</span>}
                            </button>
                          ))}
                          <div className="border-t border-[var(--border)] my-1" />
                          <button
                            onClick={() => { removeMember(member.id, member.user.name); setMenuId(null); }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={12} /> Remove member
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Team Member">
        <div className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="colleague@company.com"
            icon={<Mail size={15} />}
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendInvite(); }}
          />
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Role</label>
            <div className="flex gap-2">
              {["MEMBER", "ADMIN"].map((r) => {
                const cfg = ROLE_CONFIG[r];
                return (
                  <button
                    key={r}
                    onClick={() => setInviteRole(r)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all",
                      inviteRole === r
                        ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                        : "border-[var(--border)] text-[var(--text-muted)] hover:border-violet-500/20 hover:text-[var(--text-secondary)]"
                    )}
                  >
                    {cfg.icon} {r}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={sendInvite} loading={inviting} className="flex-1">Send Invite</Button>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
