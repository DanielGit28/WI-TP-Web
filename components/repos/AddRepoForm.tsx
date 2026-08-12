"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, registerRepository } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function AddRepoForm() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [repoUrl, setRepoUrl] = useState("");

  const mutation = useMutation({
    mutationFn: (url: string) => {
      if (!token) throw new Error("Sign in first");
      return registerRepository(url, token);
    },
    onSuccess: () => {
      setRepoUrl("");
      queryClient.invalidateQueries({ queryKey: ["repositories"] });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    mutation.mutate(repoUrl.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="owner/repo"
          className="min-w-0 flex-1 rounded-md border border-border bg-surface-2 px-3 py-1.5 font-mono text-sm text-text-primary placeholder:text-text-faint focus:border-push focus:outline-none"
        />
        <button
          type="submit"
          disabled={mutation.isPending || !repoUrl.trim()}
          className="shrink-0 rounded-md bg-push px-3 py-1.5 text-sm font-medium text-surface-0 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {mutation.isPending ? "Registering…" : "Register repo"}
        </button>
      </div>
      <p className="text-xs text-text-faint">
        Registering installs a webhook on GitHub. Admin access required.
      </p>
      {mutation.isError && (
        <p className="text-xs text-danger">
          {mutation.error instanceof ApiError
            ? mutation.error.message
            : "Something went wrong registering that repo."}
        </p>
      )}
    </form>
  );
}
