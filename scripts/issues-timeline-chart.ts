#!/usr/bin/env tsx
/**
 * Generates a timeline (gantt-style) SVG from a GitHub Projects v2 board.
 *
 *   one issue = one bar
 *   bar start = project field "Start"
 *   bar end   = issue closedAt (if closed) OR issue field "Deadline"
 *
 * Usage:
 *   export GITHUB_TOKEN=ghp_xxx            # or just be logged in with `gh auth login`
 *   npx tsx timeline.ts <owner> <projectNumber> [output.svg]
 *
 * Example:
 *   npx tsx timeline.ts my-org 4 timeline.svg
 *
 * Optional env vars:
 *   START_FIELD     name of the PROJECT date field   (default "Start")
 *   DEADLINE_FIELD  name of the ISSUE date field     (default "Deadline")
 *                   (falls back to a project field of the same name if the issue has none)
 *
 * Note: GitHub "issue fields" are in preview and need the `GraphQL-Features: issue_fields`
 * header (sent automatically). They are only readable if issue fields are enabled for your org.
 *   INCLUDE_ARCHIVED=1   also include archived project items
 *
 * Requires Node 18+ (global fetch). No npm dependencies besides tsx/typescript.
 */

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

// ───────────────────────────── config ─────────────────────────────

const [owner, numberArg, outArg] = process.argv.slice(2);
if (!owner || !numberArg) {
  console.error("Usage: npx tsx timeline.ts <owner> <projectNumber> [output.svg]");
  process.exit(1);
}
const PROJECT_NUMBER = Number(numberArg);
const OUT = outArg ?? "timeline.svg";
const START_FIELD = process.env.START_FIELD ?? "Start";
const DEADLINE_FIELD = process.env.DEADLINE_FIELD ?? "Deadline";
const INCLUDE_ARCHIVED = process.env.INCLUDE_ARCHIVED === "1";

// ───────────────────────────── auth ─────────────────────────────

/**
 * Token resolution order:
 *   1. GITHUB_TOKEN / GH_TOKEN env var
 *   2. `gh auth token` (GitHub CLI)
 *
 * Token needs access to Projects + Issues:
 *   - classic PAT: scopes `repo` + `read:project`  (works for user AND org projects)
 *   - fine-grained PAT: only works for ORG-owned projects
 *       (org permission "Projects: read" + repo permission "Issues: read")
 *   - gh CLI: run `gh auth refresh -s read:project` once
 */
function getToken(): string {
  const env = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (env) return env;
  try {
    return execSync("gh auth token", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    console.error(
      "No GitHub token found. Set GITHUB_TOKEN (classic PAT with `repo` + `read:project`) " +
        "or log in with the GitHub CLI: `gh auth login`."
    );
    process.exit(1);
  }
}

// ───────────────────────────── GitHub API ─────────────────────────────

interface Issue {
  number: number;
  title: string;
  url: string;
  repo: string;
  closed: boolean;
  createdAt: Date|null;
  closedAt: Date | null;
  start: Date | null;
  deadline: Date | null;
}

const QUERY = (ownerType: "organization" | "user") => /* GraphQL */ `
  query ($owner: String!, $number: Int!, $cursor: String) {
    ${ownerType}(login: $owner) {
      projectV2(number: $number) {
        title
        items(first: 100, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes {
            isArchived
            content {
              __typename
              ... on Issue {
                number
                title
                url
                state
                closedAt
				createdAt
                repository { nameWithOwner }
                issueFieldValues(first: 20) {
                  nodes {
                    __typename
                    ... on IssueFieldDateValue {
                      value
                      field { ... on IssueFieldDate { name } }
                    }
                  }
                }
              }
            }
            fieldValues(first: 30) {
              nodes {
                __typename
                ... on ProjectV2ItemFieldDateValue {
                  date
                  field { ... on ProjectV2FieldCommon { name } }
                }
              }
            }
          }
        }
      }
    }
  }
`;

/** Accepts "2026-04-15" or a full ISO timestamp; always returns UTC midnight-based date. */
function parseDate(v: string): Date {
  return new Date(v.includes("T") ? v : v + "T00:00:00Z");
}

async function gql(token: string, query: string, variables: object) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "project-timeline-script",
      "GraphQL-Features": "issue_fields", // required to read issue fields
    },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401) throw new Error("401 Unauthorized – check your token.");
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);
  return (await res.json()) as { data?: any; errors?: { type?: string; message: string }[] };
}

/** Returns null if the project isn't found under this owner type. */
async function fetchProject(
  token: string,
  ownerType: "organization" | "user"
): Promise<{ title: string; issues: Issue[] } | null> {
  const issues: Issue[] = [];
  let title = "";
  let cursor: string | null = null;

  for (;;) {
    const json = await gql(token, QUERY(ownerType), { owner, number: PROJECT_NUMBER, cursor });

    if (json.errors?.length) {
      const allNotFound = json.errors.every((e) => e.type === "NOT_FOUND");
      if (allNotFound) return null;
      throw new Error(json.errors.map((e) => e.message).join("\n"));
    }
    const project = json.data?.[ownerType]?.projectV2;
    if (!project) return null;

    title = project.title;
    for (const node of project.items.nodes) {
      if (node.isArchived && !INCLUDE_ARCHIVED) continue;
      const c = node.content;
      if (!c || c.__typename !== "Issue") continue; // skip draft issues / PRs

      // project-level date fields (e.g. "Start")
      const dates: Record<string, Date> = {};
      for (const fv of node.fieldValues.nodes) {
        if (fv.__typename === "ProjectV2ItemFieldDateValue" && fv.date && fv.field?.name) {
          dates[fv.field.name] = parseDate(fv.date);
        }
      }

      // issue-level date fields (e.g. "Deadline")
      const issueDates: Record<string, Date> = {};
      for (const fv of c.issueFieldValues?.nodes ?? []) {
        if (fv.__typename === "IssueFieldDateValue" && fv.value && fv.field?.name) {
          issueDates[fv.field.name] = parseDate(fv.value);
        }
      }

      issues.push({
        number: c.number,
        title: c.title,
        url: c.url,
        repo: c.repository.nameWithOwner,
        closed: c.state === "CLOSED",
        closedAt: c.closedAt ? new Date(c.closedAt) : null,
		createdAt: c.createdAt ? new Date(c.createdAt) : null,
        start: dates[START_FIELD] ?? null,
        deadline: issueDates[DEADLINE_FIELD] ?? dates[DEADLINE_FIELD] ?? null,
      });
    }

    const { hasNextPage, endCursor } = project.items.pageInfo;
    if (!hasNextPage) break;
    cursor = endCursor;
  }
  return { title, issues };
}

// ───────────────────────────── rendering ─────────────────────────────

const DAY = 86_400_000;

interface Bar {
  issue: Issue;
  start: Date;
  end: Date;
  kind: "closed" | "open" | "overdue" | "open-ended";
}

function buildBars(issues: Issue[], today: Date): Bar[] {
  const bars: Bar[] = [];
  for (const issue of issues) {
	const start = issue.start ?? issue.createdAt
    if (!start) {
      console.warn(`⚠ skipping #${issue.number} "${issue.title}" (${issue.repo}): no "${START_FIELD}" date`);
      continue;
    }
    let end: Date;
    let kind: Bar["kind"];
    if (issue.closed && issue.closedAt) {
      end = issue.closedAt;
      kind = "closed";
    } else if (issue.deadline) {
      end = issue.deadline;
      kind = issue.deadline < today ? "overdue" : "open";
    } else {
      end = today; // open issue with no deadline → runs until today
      kind = "open-ended";
    }
    // never let a bar be shorter than one day (or negative)
    if (end.getTime() < start.getTime() + DAY) {
      end = new Date(start.getTime() + DAY);
    }
    bars.push({ issue, start, end, kind });
  }
  return bars.sort((a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime());
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const fmt = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function renderSvg(projectTitle: string, bars: Bar[], today: Date): string {
  const W = 1400;
  const labelW = 380;
  const rightPad = 30;
  const top = 96;
  const rowH = 28;
  const barH = 16;
  const H = top + bars.length * rowH + 24;
  const chartW = W - labelW - rightPad;

  const allDates = bars.flatMap((b) => [b.start, b.end]).concat(today);
  const min = new Date(Math.min(...allDates.map((d) => d.getTime())) - 3 * DAY);
  const max = new Date(Math.max(...allDates.map((d) => d.getTime())) + 3 * DAY);
  const x = (d: Date) => labelW + ((d.getTime() - min.getTime()) / (max.getTime() - min.getTime())) * chartW;

  // month (or quarter) grid
  const spanMonths = (max.getTime() - min.getTime()) / (30 * DAY);
  const step = spanMonths > 24 ? 3 : 1;
  const ticks: Date[] = [];
  let t = new Date(Date.UTC(min.getUTCFullYear(), min.getUTCMonth(), 1));
  while (t <= max) {
    if (t >= min) ticks.push(new Date(t));
    t = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + step, 1));
  }

  const out: string[] = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif">`);
  out.push(`<style>
    :root { --bg:#ffffff; --fg:#1f2328; --muted:#656d76; --grid:#d8dee4; --row:#f6f8fa;
            --closed:#8250df; --open:#0969da; --overdue:#cf222e; --openended:#0969da; --today:#bf8700; }
    @media (prefers-color-scheme: dark) {
      :root { --bg:#0d1117; --fg:#e6edf3; --muted:#8b949e; --grid:#30363d; --row:#161b22;
              --closed:#a371f7; --open:#4493f8; --overdue:#f85149; --openended:#4493f8; --today:#d29922; }
    }
    text { fill: var(--fg); font-size: 12px; }
    .muted { fill: var(--muted); }
    .title { font-size: 18px; font-weight: 600; }
    .grid { stroke: var(--grid); stroke-width: 1; }
    .row { fill: var(--row); }
    .closed { fill: var(--closed); }
    .open { fill: var(--open); }
    .overdue { fill: var(--overdue); }
    .open-ended { fill: var(--openended); fill-opacity: .3; stroke: var(--openended); stroke-dasharray: 4 3; }
    .today { stroke: var(--today); stroke-width: 2; stroke-dasharray: 5 3; }
    .deadline { fill: var(--fg); }
    a:hover text { text-decoration: underline; }
  </style>`);
  out.push(`<rect width="${W}" height="${H}" fill="var(--bg)"/>`);
  out.push(`<text x="20" y="30" class="title">${esc(projectTitle)} – timeline</text>`);

  // legend
  const legend: [string, string][] = [
    ["closed", "Closed (ends at close date)"],
    ["open", "Open (ends at deadline)"],
    ["overdue", "Open, past deadline"],
    ["open-ended", "Open, no deadline (until today)"],
  ];
  let lx = 20;
  for (const [cls, label] of legend) {
    out.push(`<rect x="${lx}" y="44" width="14" height="10" rx="2" class="${cls}"/>`);
    out.push(`<text x="${lx + 20}" y="53" class="muted">${esc(label)}</text>`);
    lx += 40 + label.length * 6.3;
  }
  out.push(`<path d="M${lx + 6} 43 l5 5 -5 5 -5 -5z" class="deadline"/>`);
  out.push(`<text x="${lx + 20}" y="53" class="muted">Deadline (when different from end)</text>`);

  // rows
  bars.forEach((_, i) => {
    if (i % 2 === 0) out.push(`<rect x="0" y="${top + i * rowH}" width="${W}" height="${rowH}" class="row"/>`);
  });

  // grid + axis labels
  for (const tk of ticks) {
    const gx = x(tk);
    out.push(`<line x1="${gx}" y1="${top - 6}" x2="${gx}" y2="${H - 16}" class="grid"/>`);
    out.push(
      `<text x="${gx + 4}" y="${top - 12}" class="muted">${tk.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" })}</text>`
    );
  }

  // bars
  bars.forEach((b, i) => {
    const y = top + i * rowH;
    const bx = x(b.start);
    const bw = Math.max(x(b.end) - bx, 3);
    const label = `#${b.issue.number} ${trunc(b.issue.title, 46)}`;

    out.push(`<a href="${esc(b.issue.url)}" target="_blank">`);
    out.push(`<text x="20" y="${y + rowH / 2 + 4}">${esc(label)}</text>`);
    out.push(`<rect x="${bx}" y="${y + (rowH - barH) / 2}" width="${bw}" height="${barH}" rx="3" class="${b.kind}">`);
    out.push(
      `<title>${esc(`${b.issue.repo}#${b.issue.number}: ${b.issue.title}\n${fmt(b.start)} → ${fmt(b.end)}` +
        (b.issue.deadline ? `\nDeadline: ${fmt(b.issue.deadline)}` : "") +
        (b.issue.closed ? "\nClosed" : "\nOpen"))}</title>`
    );
    out.push(`</rect>`);

    // deadline diamond for closed issues (so you can see early/late completion)
    if (b.kind === "closed" && b.issue.deadline) {
      const dx = x(b.issue.deadline);
      const cy = y + rowH / 2;
      out.push(`<path d="M${dx} ${cy - 6} l6 6 -6 6 -6 -6z" class="deadline"/>`);
    }
    out.push(`</a>`);
  });

  // today marker
  const tx = x(today);
  out.push(`<line x1="${tx}" y1="${top - 6}" x2="${tx}" y2="${H - 16}" class="today"/>`);
  out.push(`<text x="${tx + 4}" y="${H - 4}" class="muted">today</text>`);

  out.push(`</svg>`);
  return out.join("\n");
}

// ───────────────────────────── main ─────────────────────────────

async function main() {
  const token = getToken();

  // owner can be an org or a user – try both
  const project =
    (await fetchProject(token, "organization")) ?? (await fetchProject(token, "user"));
  if (!project) {
    console.error(
      `Project #${PROJECT_NUMBER} not found for "${owner}". Check the owner/number, and that your token has ` +
        "`read:project` (+ `repo` for private repos) access."
    );
    process.exit(1);
  }

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const bars = buildBars(project.issues, today);
  if (!bars.length) {
    console.error(`No issues with a "${START_FIELD}" date found – nothing to draw.`);
    process.exit(1);
  }

  writeFileSync(OUT, renderSvg(project.title, bars, today), "utf8");
  console.log(`✓ ${bars.length} bars written to ${OUT} (from ${project.issues.length} issues in "${project.title}")`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
