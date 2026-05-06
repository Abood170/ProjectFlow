"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "login">("loading");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    params.then((p) => {
      setToken(p.token);
      if (!session) {
        setStatus("login");
        return;
      }
      acceptInvite(p.token);
    });
  }, [session]);

  const acceptInvite = async (t: string) => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/invite/${t}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.workspaceName || "Workspace");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setStatus("error");
        setMessage(data.error || "Invite may be expired or invalid.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-8 text-center">
        {status === "loading" && (
          <>
            <div className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Processing your invite...</p>
          </>
        )}
        {status === "login" && (
          <>
            <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">P</div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">You&apos;ve been invited!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Sign in to accept your workspace invitation.</p>
            <Button onClick={() => signIn(undefined, { callbackUrl: `/invite/${token}` })} className="w-full">
              Sign In to Accept
            </Button>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Invite accepted!</h2>
            <p className="text-slate-500 dark:text-slate-400">You&apos;ve joined <strong>{message}</strong>. Redirecting...</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Invite invalid</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{message}</p>
            <Button onClick={() => router.push("/dashboard")} variant="outline">
              Go to Dashboard
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
