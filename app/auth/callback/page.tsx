"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { storeTokenFromFragment } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const token = storeTokenFromFragment();
    if (!token) {
      // Deferred a tick rather than set synchronously in the effect body —
      // avoids the extra cascading render the direct call would trigger.
      queueMicrotask(() => setFailed(true));
      return;
    }
    // Full reload rather than router.push so AuthProvider's mount-time
    // localStorage read picks the token up immediately, instead of the
    // provider having already initialized with no token in this tab.
    window.location.href = "/dashboard";
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      {failed ? (
        <>
          <p className="font-display text-lg text-text-primary">Sign-in didn&apos;t go through</p>
          <p className="max-w-sm text-sm text-text-muted">
            No token came back from GitHub. Try signing in again.
          </p>
          <a href="/dashboard" className="mt-2 text-sm text-push underline underline-offset-4">
            Back to the console
          </a>
        </>
      ) : (
        <p className="text-sm text-text-muted">Signing you in…</p>
      )}
    </main>
  );
}
