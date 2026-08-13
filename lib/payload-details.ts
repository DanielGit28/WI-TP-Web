/**
 * Pulls a handful of human-relevant fields out of a raw GitHub webhook
 * payload per event type, so the delivery detail page can show "PR #128,
 * merged, feat/x → main" instead of making every visitor read JSON to
 * find that out. Covers the event types that make up the bulk of real
 * traffic; anything else just falls back to the raw payload view, same
 * as before — this is additive, not a replacement for it.
 *
 * Every accessor is defensive (GitHub's payload shapes are stable but not
 * guaranteed present on every delivery, and this is unvalidated JSON from
 * the wire) — a missing/wrong-typed field is silently omitted rather than
 * thrown on.
 */
export interface PayloadDetail {
  label: string;
  value: string;
  href?: string;
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}
function num(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}
function bool(v: unknown): v is true {
  return v === true;
}
function obj(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : undefined;
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function extractPayloadDetails(eventType: string, payload: unknown): PayloadDetail[] {
  const p = obj(payload);
  if (!p) return [];
  const details: PayloadDetail[] = [];
  const push = (label: string, value: string | undefined, href?: string) => {
    if (value) details.push({ label, value, href });
  };

  switch (eventType) {
    case "push": {
      const ref = str(p.ref);
      push("branch", ref?.replace("refs/heads/", ""));
      push("commits", String(arr(p.commits).length));
      push("head commit", str(obj(p.head_commit)?.message)?.split("\n")[0]);
      push("compare", str(p.compare), str(p.compare));
      break;
    }
    case "pull_request": {
      const pr = obj(p.pull_request);
      const number = num(p.number);
      push("number", number ? `#${number}` : undefined);
      push("title", str(pr?.title));
      push("state", bool(pr?.merged) ? "merged" : str(pr?.state));
      const baseRef = str(obj(pr?.base)?.ref);
      const headRef = str(obj(pr?.head)?.ref);
      push("branches", baseRef && headRef ? `${headRef} → ${baseRef}` : undefined);
      push("link", str(pr?.html_url), str(pr?.html_url));
      break;
    }
    case "pull_request_review": {
      const review = obj(p.review);
      push("state", str(review?.state));
      push("reviewer", str(obj(review?.user)?.login));
      push("link", str(review?.html_url), str(review?.html_url));
      break;
    }
    case "issues": {
      const issue = obj(p.issue);
      const number = num(issue?.number);
      push("number", number ? `#${number}` : undefined);
      push("title", str(issue?.title));
      push("state", str(issue?.state));
      push("link", str(issue?.html_url), str(issue?.html_url));
      break;
    }
    case "issue_comment":
    case "commit_comment":
    case "pull_request_review_comment": {
      const comment = obj(p.comment);
      const body = str(comment?.body);
      push("comment", body ? truncate(body, 140) : undefined);
      push("author", str(obj(comment?.user)?.login));
      push("link", str(comment?.html_url), str(comment?.html_url));
      break;
    }
    case "release": {
      const release = obj(p.release);
      push("tag", str(release?.tag_name));
      push("name", str(release?.name));
      push("draft", bool(release?.draft) ? "yes" : undefined);
      push("prerelease", bool(release?.prerelease) ? "yes" : undefined);
      push("link", str(release?.html_url), str(release?.html_url));
      break;
    }
    case "star":
    case "watch": {
      push("starred at", str(p.starred_at));
      break;
    }
    case "create":
    case "delete": {
      push("ref type", str(p.ref_type));
      push("ref", str(p.ref));
      break;
    }
    case "fork": {
      push("forked to", str(obj(p.forkee)?.full_name));
      break;
    }
    case "workflow_run": {
      const run = obj(p.workflow_run);
      push("workflow", str(run?.name));
      push("status", str(run?.status));
      push("conclusion", str(run?.conclusion));
      const runNumber = num(run?.run_number);
      push("run", runNumber ? `#${runNumber}` : undefined);
      push("branch", str(run?.head_branch));
      break;
    }
    case "workflow_job": {
      const job = obj(p.workflow_job);
      push("job", str(job?.name));
      push("status", str(job?.status));
      push("conclusion", str(job?.conclusion));
      break;
    }
    case "check_run": {
      const run = obj(p.check_run);
      push("check", str(run?.name));
      push("status", str(run?.status));
      push("conclusion", str(run?.conclusion));
      break;
    }
    case "check_suite": {
      const suite = obj(p.check_suite);
      push("status", str(suite?.status));
      push("conclusion", str(suite?.conclusion));
      break;
    }
    case "deployment": {
      const deployment = obj(p.deployment);
      push("environment", str(deployment?.environment));
      push("ref", str(deployment?.ref));
      break;
    }
    case "deployment_status": {
      const status = obj(p.deployment_status);
      push("state", str(status?.state));
      push("environment", str(status?.environment));
      break;
    }
    case "member": {
      push("member", str(obj(p.member)?.login));
      push("action", str(p.action));
      break;
    }
    case "label": {
      push("label", str(obj(p.label)?.name));
      break;
    }
    case "milestone": {
      push("milestone", str(obj(p.milestone)?.title));
      break;
    }
    default:
      break;
  }

  return details;
}
