"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.password.length < 8) errs.password = "Min. 8 characters";
    if (form.password !== form.confirm) errs.confirm = "Passwords do not match";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.password }),
      });
      if (res.ok) {
        toast.success("Password reset! Please sign in.");
        router.push("/login");
      } else {
        const d = await res.json();
        toast.error(d.error || "Reset failed. Link may be expired.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="animate-fade-in-up text-center">
        <div className="h-14 w-14 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-5">
          <Lock size={24} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Invalid reset link</h2>
        <p className="text-[var(--text-muted)] text-sm mb-6">
          This link is invalid or has expired.
        </p>
        <Link href="/forgot-password" className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Set new password</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          placeholder="Min. 8 characters"
          icon={<Lock size={15} />}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          icon={<Lock size={15} />}
          value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          error={errors.confirm}
        />
        <Button type="submit" className="w-full mt-2" loading={loading}>
          Reset Password <ArrowRight size={15} />
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--text-muted)] mt-6">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-violet-400 hover:text-violet-300 font-medium transition-colors">
          <ArrowLeft size={13} /> Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
