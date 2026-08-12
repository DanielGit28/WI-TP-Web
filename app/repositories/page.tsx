"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyRepositories, getPublicRepositories, removeRepository } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AddRepoForm } from "@/components/repos/AddRepoForm";
import { RepoList } from "@/components/repos/RepoList";

export default function RepositoriesPage() {
  const { token, isAuthenticated, signIn } = useAuth();
  const queryClient = useQueryClient();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const mine = useQuery({
    queryKey: ["repositories", "mine"],
    queryFn: () => getMyRepositories(token!),
    enabled: Boolean(token),
  });

  const publicRepos = useQuery({
    queryKey: ["repositories", "public"],
    queryFn: getPublicRepositories,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => {
      if (!token) throw new Error("Sign in first");
      setRemovingId(id);
      return removeRepository(id, token);
    },
    onSettled: () => {
      setRemovingId(null);
      queryClient.invalidateQueries({ queryKey: ["repositories"] });
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-wide text-text-faint">
          POST /repositories · GET /repositories/mine · GET /repositories/public
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-text-primary">
          Repositories
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Registering a repo installs a webhook on it automatically — no manual GitHub
          settings step. You need admin access on the repo to register it.
        </p>
      </header>

      <section className="mb-6 rounded-lg border border-border bg-surface-1 p-4">
        <h2 className="mb-3 font-display text-sm font-medium text-text-primary">
          Register a repository
        </h2>
        {isAuthenticated ? (
          <AddRepoForm />
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-md border border-border-strong px-3 py-2.5">
            <p className="text-xs text-text-muted">Sign in with GitHub to register a repo.</p>
            <button
              type="button"
              onClick={signIn}
              className="shrink-0 rounded-md bg-push px-3 py-1.5 text-xs font-medium text-surface-0 hover:opacity-90"
            >
              Continue with GitHub
            </button>
          </div>
        )}
      </section>

      {isAuthenticated && (
        <section className="mb-6 rounded-lg border border-border bg-surface-1 p-4">
          <h2 className="mb-1 font-display text-sm font-medium text-text-primary">
            Your repositories
          </h2>
          <RepoList
            repos={mine.data ?? []}
            onRemove={(id) => removeMutation.mutate(id)}
            removingId={removingId}
            emptyLabel={
              mine.isLoading ? "Loading…" : "You haven't registered any repositories yet."
            }
          />
        </section>
      )}

      <section className="rounded-lg border border-border bg-surface-1 p-4">
        <h2 className="mb-1 font-display text-sm font-medium text-text-primary">
          Public repositories
        </h2>
        <p className="mb-2 text-xs text-text-faint">
          Registered by any user, visible to everyone regardless of sign-in.
        </p>
        <RepoList
          repos={publicRepos.data ?? []}
          emptyLabel={publicRepos.isLoading ? "Loading…" : "No public repositories registered yet."}
        />
      </section>
    </div>
  );
}
