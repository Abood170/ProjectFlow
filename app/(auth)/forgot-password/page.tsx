"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="animate-fade-in-up text-center">
        <div className="h-14 w-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={26} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Check your inbox</h2>
        <p className="text-[var(--text-muted)] text-sm mb-2">
          We sent a reset link to
        </p>
        <p className="font-semibold text-[var(--text-primary)] text-sm mb-6">{email}</p>
        <p className="text-xs text-[var(--text-muted)] mb-8">
          Didn&apos;t receive it? Check your spam folder, or{" "}
          <button onClick={() => setSent(false)} className="text-violet-400 hover:text-violet-300 transition-colors">
            try again
          </button>.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Forgot password?</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          icon={<Mail size={15} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <Button type="submit" className="w-full mt-2" loading={loading}>
          Send Reset Link
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
