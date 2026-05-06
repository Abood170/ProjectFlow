"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { User, Lock, Bell, Building, Camera, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Tab = "profile" | "password" | "notifications" | "workspace";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "profile",       label: "Profile",        icon: <User size={15} /> },
  { key: "password",      label: "Password",       icon: <Lock size={15} /> },
  { key: "notifications", label: "Notifications",  icon: <Bell size={15} /> },
  { key: "workspace",     label: "Workspace",      icon: <Building size={15} /> },
];

const SECTION_LABEL = "text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] block mb-1.5";

/** Center-crop + resize image to a square JPEG using canvas. */
function compressAvatar(file: File, size = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [tab, setTab] = useState<Tab>("profile");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({ current: "", newPwd: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setAvatar(session.user.image || null);
    }
  }, [session]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or GIF image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }

    setUploading(true);
    try {
      const compressed = await compressAvatar(file, 128);
      setAvatar(compressed);
    } catch {
      toast.error("Failed to process image");
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveProfile = async (overrideAvatar?: string | null) => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const avatarToSave = overrideAvatar !== undefined ? overrideAvatar : avatar;
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          avatar: avatarToSave,
          updateAvatar: true,
        }),
      });
      if (res.ok) {
        // Passing an object to update() triggers a POST to /api/auth/session,
        // which sets trigger:"update" in the JWT callback so the DB is re-read
        // and the cookie is rewritten with the fresh name + avatar.
        await update({ refresh: true });
        toast.success("Profile updated successfully");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error((data as any).error || "Failed to save profile");
      }
    } finally {
      setSaving(false);
    }
  };

  const removePhoto = () => {
    setAvatar(null);
    // Persist the removal immediately so a name-only save later doesn't restore the old photo
    saveProfile(null);
  };

  const changePassword = async () => {
    if (passwords.newPwd !== passwords.confirm) { toast.error("Passwords do not match"); return; }
    if (passwords.newPwd.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPwd }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Password changed");
        setPasswords({ current: "", newPwd: "", confirm: "" });
      } else {
        toast.error(data.error || "Failed to change password");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Tab nav */}
        <nav className="w-44 shrink-0 space-y-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                tab === t.key
                  ? "bg-violet-500/10 text-violet-300 border border-violet-500/20"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface)]"
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-xl">
          {tab === "profile" && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-6">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Profile Settings</h2>

              {/* Avatar upload */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  title="Click to upload photo"
                >
                  <Avatar name={name} src={avatar} size="xl" />
                  {/* Hover overlay */}
                  <div className={cn(
                    "absolute inset-0 rounded-full flex items-center justify-center transition-all duration-200",
                    uploading
                      ? "bg-black/50"
                      : "bg-black/0 group-hover:bg-black/50"
                  )}>
                    {uploading ? (
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="text-center space-y-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Upload photo
                  </button>
                  {avatar && (
                    <>
                      <span className="text-[var(--text-muted)] text-xs"> · </span>
                      <button
                        onClick={removePhoto}
                        className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors"
                      >
                        <X size={10} /> Remove
                      </button>
                    </>
                  )}
                  <p className="text-[11px] text-[var(--text-muted)]">JPG, PNG or GIF · max 5 MB</p>
                </div>
              </div>

              {/* Name */}
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveProfile(); }}
              />

              {/* Email (read-only) */}
              <div>
                <label className={SECTION_LABEL}>Email Address</label>
                <div className="px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-muted)]">
                  {session?.user?.email}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1.5">Email cannot be changed</p>
              </div>

              <Button onClick={() => saveProfile()} loading={saving}>Save Changes</Button>
            </div>
          )}

          {tab === "password" && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Change Password</h2>
              <div className="p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
                <p className="text-xs text-amber-400">Make sure your new password is at least 8 characters and is different from your current one.</p>
              </div>
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              />
              <Input
                label="New Password"
                type="password"
                placeholder="Min. 8 characters"
                value={passwords.newPwd}
                onChange={(e) => setPasswords({ ...passwords, newPwd: e.target.value })}
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              />
              <Button onClick={changePassword} loading={saving}>Update Password</Button>
            </div>
          )}

          {tab === "notifications" && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <h2 className="text-base font-semibold text-[var(--text-primary)] mb-5">Notification Preferences</h2>
              <div className="space-y-1">
                {[
                  { key: "task_assigned", label: "Task Assignments",   desc: "When a task is assigned to you" },
                  { key: "due_date",      label: "Due Date Reminders", desc: "When a task is due within 48 hours" },
                  { key: "mentions",      label: "Mentions",           desc: "When someone mentions you in a comment" },
                  { key: "invites",       label: "Workspace Invites",  desc: "When you receive a workspace invite" },
                ].map((pref) => (
                  <div key={pref.key} className="flex items-center justify-between py-3.5 border-b border-[var(--border)] last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{pref.label}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{pref.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className={cn(
                        "w-10 h-[22px] rounded-full transition-colors",
                        "bg-[var(--border-strong)] peer-checked:bg-violet-600",
                        "peer-focus:ring-2 peer-focus:ring-violet-500/30",
                        "after:content-[''] after:absolute after:top-[3px] after:left-[3px]",
                        "after:bg-white after:rounded-full after:h-4 after:w-4",
                        "after:transition-all peer-checked:after:translate-x-[18px]"
                      )} />
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <Button onClick={() => toast.success("Preferences saved")}>Save Preferences</Button>
              </div>
            </div>
          )}

          {tab === "workspace" && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Workspace Settings</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Workspace settings can be configured by workspace owners and admins.
              </p>
              <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <p className="text-sm text-[var(--text-secondary)]">
                  To manage workspace members, go to the{" "}
                  <a href="/team" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
                    Team page
                  </a>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
