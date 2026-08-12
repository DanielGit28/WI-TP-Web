import type { Repository } from "@/lib/types";

interface RepoListProps {
  repos: Repository[];
  onRemove?: (id: string) => void;
  removingId?: string | null;
  emptyLabel: string;
}

export function RepoList({ repos, onRemove, removingId, emptyLabel }: RepoListProps) {
  if (repos.length === 0) {
    return <p className="px-1 py-6 text-sm text-text-faint">{emptyLabel}</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {repos.map((repo) => (
        <li key={repo.id} className="flex items-center justify-between gap-3 px-1 py-2.5">
          <div className="min-w-0">
            <p className="truncate font-mono text-sm text-text-secondary">{repo.fullName}</p>
            <p className="text-xs text-text-faint">
              {repo.visibility} · added {new Date(repo.createdAt).toLocaleDateString()}
            </p>
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(repo.id)}
              disabled={removingId === repo.id}
              className="shrink-0 rounded-md border border-border-strong px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
            >
              {removingId === repo.id ? "Removing…" : "Remove"}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
