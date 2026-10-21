#!/usr/bin/env tsx
/**
 * Generates a timeline (gantt-style) SVG from the issues of a GitHub repo.
 *
 * Which issues become bars:
 *   every issue of the repo that is CLOSED, or has a "Deadline" issue field set
 *
 * Bar start (first one that exists wins):
 *   1. project field "Start"  (only if the issue is in the given project)
 *   2. earliest creation date of the pull requests that close the issue
 *   3. the issue's own creation date
 *
 * Bar end:
 *   issue closedAt (if closed)  OR  issue field "Deadline"
 *
 * Usage:
 *   export GITHUB_TOKEN=ghp_xxx          # or be logged in with `gh auth login`
 *   npx tsx timeline.ts <owner/repo> [projectNumber] [output.svg]
 *
 * Examples:
 *   npx tsx timeline.ts my-org/my-repo 4 timeline.svg
 *   npx tsx timeline.ts my-org/my-repo            # no project -> Start comes from PRs only
 *
 * Optional env vars:
 *   START_FIELD         name of the PROJECT date field   (default "Start")
 *   DEADLINE_FIELD      name of the ISSUE date field     (default "Deadline")
 *   PROJECT_OWNER       owner of the project             (default: the repo owner)
 *   SINCE=2026-01-01    drop bars that end before this date (handy for big repos)
 *   UNTIL=2026-12-31    zoom: the chart stops at this date. Bars that run past it are cut off
 *                       at the right edge and show their real end date written on the bar.
 *                       Bars that start after it are dropped.
 *   EXCLUDE_NOT_PLANNED=1   ignore issues closed as "not planned" / duplicate
 *
 * Token: classic PAT with `repo` (+ `read:project` if you use a project), or a fine-grained PAT
 * with Issues: read, Pull requests: read (and Projects: read for org projects).
 * `gh` CLI users: `gh auth refresh -s read:project`.
 *
 * Requires Node 18+ (global fetch). No npm dependencies besides tsx/typescript.
 */

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

// ───────────────────────────── config ─────────────────────────────

const [repoArg, arg2, arg3] = process.argv.slice(2);
if (!repoArg || !repoArg.includes("/")) {
  console.error("Usage: npx tsx timeline.ts <owner/repo> [projectNumber] [output.svg]");
  process.exit(1);
}
const [OWNER, REPO] = repoArg.split("/");

// 2nd arg is a project number if numeric, otherwise treated as the output file
const PROJECT_NUMBER = arg2 && /^\d+$/.test(arg2) ? Number(arg2) : null;
const OUT = (PROJECT_NUMBER === null ? arg2 : arg3) ?? "timeline.svg";

const START_FIELD = process.env.START_FIELD ?? "Start";
const DEADLINE_FIELD = process.env.DEADLINE_FIELD ?? "Deadline";
const PROJECT_OWNER = (process.env.PROJECT_OWNER ?? OWNER).toLowerCase();
const SINCE = process.env.SINCE ? new Date(process.env.SINCE + "T00:00:00Z") : null;
const UNTIL = process.env.UNTIL ? new Date(process.env.UNTIL + "T00:00:00Z") : null;
const EXCLUDE_NOT_PLANNED = process.env.INCLUDE_NOT_PLANNED !== "1";

// ───────────────────────────── auth ─────────────────────────────

function getToken(): string {
  const env = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (env) return env;
  try {
    return execSync("gh auth token", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    console.error(
      "No GitHub token found. Set GITHUB_TOKEN (classic PAT with `repo` + `read:project`) " +
        "or log in with the GitHub CLI: `gh auth login`."
    );
    process.exit(1);
  }
}

// ───────────────────────────── GitHub API ─────────────────────────────

type StartSource = "project field" | "first closing PR" | "issue creation";

interface Issue {
  number: number;
  title: string;
  url: string;
  closed: boolean;
  closedAt: Date | null;
  start: Date;
  startSource: StartSource;
  deadline: Date | null;
}

const QUERY = /* GraphQL */ `
  query ($owner: String!, $name: String!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      nameWithOwner
      issues(first: 100, after: $cursor, orderBy: { field: CREATED_AT, direction: ASC }) {
        pageInfo { hasNextPage endCursor }
        nodes {
          number
          title
          url
          state
          stateReason
          createdAt
          closedAt
          issueFieldValues(first: 20) {
            nodes {
              __typename
              ... on IssueFieldDateValue {
                value
                field { ... on IssueFieldDate { name } }
              }
            }
          }
          closedByPullRequestsReferences(first: 20, includeClosedPrs: true) {
            nodes { createdAt }
          }
          projectItems(first: 10) {
            nodes {
              project {
                number
                owner {
                  __typename
                  ... on Organization { login }
                  ... on User { login }
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
  }
`;

/** Accepts "2026-04-15" or a full ISO timestamp. */
function parseDate(v: string): Date {
  return new Date(v.includes("T") ? v : v + "T00:00:00Z");
}

async function gql(token: string, variables: object) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "repo-timeline-script",
      "GraphQL-Features": "issue_fields", // required to read issue fields (preview)
    },
    body: JSON.stringify({ query: QUERY, variables }),
  });
  if (res.status === 401) throw new Error("401 Unauthorized – check your token.");
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);
  return (await res.json()) as { data?: any; errors?: { type?: string; message: string }[] };
}

async function fetchIssues(token: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  let cursor: string | null = null;
  let scanned = 0;

  for (;;) {
    const json = await gql(token, { owner: OWNER, name: REPO, cursor });
    if (json.errors?.length) {
      if (json.errors.every((e) => e.type === "NOT_FOUND")) {
        throw new Error(`Repository ${OWNER}/${REPO} not found (or your token can't see it).`);
      }
      throw new Error(json.errors.map((e) => e.message).join("\n"));
    }
    const page = json.data.repository.issues;

    for (const n of page.nodes) {
      scanned++;
      const closed = n.state === "CLOSED";

      // issue-level date fields (e.g. "Deadline")
      let deadline: Date | null = null;
      for (const fv of n.issueFieldValues?.nodes ?? []) {
        if (fv.__typename === "IssueFieldDateValue" && fv.value && fv.field?.name === DEADLINE_FIELD) {
          deadline = parseDate(fv.value);
        }
      }

      // selection: closed OR has a deadline
      if (!closed && !deadline) continue;
      if (closed && EXCLUDE_NOT_PLANNED && (n.stateReason === "NOT_PLANNED" || n.stateReason === "DUPLICATE")) continue;

      // start date, in order of preference
      let start: Date | null = null;
      let startSource: StartSource = "issue creation";

      if (PROJECT_NUMBER !== null) {
        for (const item of n.projectItems?.nodes ?? []) {
          const p = item.project;
          if (p?.number !== PROJECT_NUMBER || p.owner?.login?.toLowerCase() !== PROJECT_OWNER) continue;
          for (const fv of item.fieldValues.nodes) {
            if (fv.__typename === "ProjectV2ItemFieldDateValue" && fv.date && fv.field?.name === START_FIELD) {
              start = parseDate(fv.date);
              startSource = "project field";
            }
          }
        }
      }
      if (!start) {
        const prDates: Date[] = (n.closedByPullRequestsReferences?.nodes ?? [])
          .filter(Boolean)
          .map((pr: { createdAt: string }) => new Date(pr.createdAt));
        if (prDates.length) {
          start = new Date(Math.min(...prDates.map((d) => d.getTime())));
          startSource = "first closing PR";
        }
      }
      if (!start) start = new Date(n.createdAt);

      issues.push({
        number: n.number,
        title: n.title,
        url: n.url,
        closed,
        closedAt: n.closedAt ? new Date(n.closedAt) : null,
        start,
        startSource,
        deadline,
      });
    }

    if (!page.pageInfo.hasNextPage) break;
    cursor = page.pageInfo.endCursor;
    process.stdout.write(`\r  scanned ${scanned} issues…`);
  }
  console.log(`\r  scanned ${scanned} issues, ${issues.length} selected`);
  return issues;
}

// ───────────────────────────── rendering ─────────────────────────────

const DAY = 86_400_000;

interface Bar {
  issue: Issue;
  start: Date;
  end: Date;
  kind: "closed" | "open" | "overdue";
}

function buildBars(issues: Issue[], today: Date): Bar[] {
  const bars: Bar[] = [];
  for (const issue of issues) {
    let end: Date;
    let kind: Bar["kind"];
    if (issue.closed && issue.closedAt) {
      end = issue.closedAt;
      kind = "closed";
    } else {
      end = issue.deadline!; // guaranteed by the selection filter
      kind = end < today ? "overdue" : "open";
    }
    if (SINCE && end < SINCE) continue;
    if (UNTIL && issue.start > UNTIL) continue;
    // never let a bar be shorter than one day (or negative)
    if (end.getTime() < issue.start.getTime() + DAY) end = new Date(issue.start.getTime() + DAY);
    bars.push({ issue, start: issue.start, end, kind });
  }
  return bars.sort((a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime());
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const fmt = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function renderSvg(title: string, bars: Bar[], today: Date): string {
  const W = 1400;
  const labelW = 380;
  const rightPad = 30;
  const top = 96;
  const rowH = 28;
  const barH = 16;
  const H = top + bars.length * rowH + 24;
  const chartW = W - labelW - rightPad;

  // with UNTIL, bar ends are clipped to it and it becomes the right edge of the chart
  const clip = (d: Date) => (UNTIL && d > UNTIL ? UNTIL : d);
  const allDates = bars.flatMap((b) => [b.start, clip(b.end)]);
  if (!UNTIL) allDates.push(today);
  const min = new Date(Math.min(...allDates.map((d) => d.getTime())) - 3 * DAY);
  const max = UNTIL ?? new Date(Math.max(...allDates.map((d) => d.getTime())) + 3 * DAY);
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
            --closed:#8250df; --open:#0969da; --overdue:#cf222e; --today:#bf8700; }
    @media (prefers-color-scheme: dark) {
      :root { --bg:#0d1117; --fg:#e6edf3; --muted:#8b949e; --grid:#30363d; --row:#161b22;
              --closed:#a371f7; --open:#4493f8; --overdue:#f85149; --today:#d29922; }
    }
    text { fill: var(--fg); font-size: 12px; }
    .muted { fill: var(--muted); }
    .onbar { fill: #ffffff; font-size: 11px; font-weight: 600; }
    .title { font-size: 18px; font-weight: 600; }
    .grid { stroke: var(--grid); stroke-width: 1; }
    .row { fill: var(--row); }
    .closed { fill: var(--closed); }
    .open { fill: var(--open); }
    .overdue { fill: var(--overdue); }
    .today { stroke: var(--today); stroke-width: 2; stroke-dasharray: 5 3; }
    .deadline { fill: var(--fg); }
    a:hover text { text-decoration: underline; }
  </style>`);
  out.push(`<rect width="${W}" height="${H}" fill="var(--bg)"/>`);
  out.push(`<text x="20" y="30" class="title">${esc(title)} – timeline</text>`);

  // legend
  const legend: [string, string][] = [
    ["closed", "Closed (ends at close date)"],
    ["open", "Open (ends at deadline)"],
    ["overdue", "Open, past deadline"],
  ];
  let lx = 20;
  for (const [cls, label] of legend) {
    out.push(`<rect x="${lx}" y="44" width="14" height="10" rx="2" class="${cls}"/>`);
    out.push(`<text x="${lx + 20}" y="53" class="muted">${esc(label)}</text>`);
    lx += 40 + label.length * 6.3;
  }
  out.push(`<path d="M${lx + 6} 43 l5 5 -5 5 -5 -5z" class="deadline"/>`);
  out.push(`<text x="${lx + 20}" y="53" class="muted">Deadline (on closed issues)</text>`);

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
    const clipped = UNTIL !== null && b.end > UNTIL;
    const endX = x(clip(b.end));
    const bw = Math.max(endX - bx, 3);
    const label = `#${b.issue.number} ${trunc(b.issue.title, 46)}`;

    out.push(`<a href="${esc(b.issue.url)}" target="_blank">`);
    out.push(`<text x="20" y="${y + rowH / 2 + 4}">${esc(label)}</text>`);
    out.push(`<rect x="${bx}" y="${y + (rowH - barH) / 2}" width="${bw}" height="${barH}" rx="3" class="${b.kind}">`);
    out.push(
      `<title>${esc(
        `#${b.issue.number}: ${b.issue.title}\n${fmt(b.start)} → ${fmt(b.end)}` +
          `\nStart from: ${b.issue.startSource}` +
          (b.issue.deadline ? `\nDeadline: ${fmt(b.issue.deadline)}` : "") +
          (b.issue.closed ? "\nClosed" : "\nOpen")
      )}</title>`
    );
    out.push(`</rect>`);

    // bar runs past the zoom window -> write its real end date on the bar
    if (clipped) {
      const text = `→ ${fmt(b.end)}`;
      const fits = bw >= text.length * 6.3 + 14;
      out.push(
        fits
          ? `<text x="${endX - 6}" y="${y + rowH / 2 + 4}" text-anchor="end" class="onbar">${esc(text)}</text>`
          : `<text x="${bx - 6}" y="${y + rowH / 2 + 4}" text-anchor="end" class="muted">${esc(text)}</text>`
      );
    }

    // deadline diamond for closed issues (shows early/late completion)
    if (b.kind === "closed" && b.issue.deadline && b.issue.deadline <= max) {
      const dx = x(b.issue.deadline);
      const cy = y + rowH / 2;
      out.push(`<path d="M${dx} ${cy - 6} l6 6 -6 6 -6 -6z" class="deadline"/>`);
    }
    out.push(`</a>`);
  });

  // today marker
  if (today >= min && today <= max) {
    const tx = x(today);
    out.push(`<line x1="${tx}" y1="${top - 6}" x2="${tx}" y2="${H - 16}" class="today"/>`);
    out.push(`<text x="${tx + 4}" y="${H - 4}" class="muted">today</text>`);
  }

  out.push(`</svg>`);
  return out.join("\n");
}

// ───────────────────────────── main ─────────────────────────────

async function main() {
  const token = getToken();
  console.log(`Fetching issues of ${OWNER}/${REPO}…`);
  const issues = await fetchIssues(token);

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const bars = buildBars(issues, today);
  if (!bars.length) {
    console.error("No closed issues or issues with a deadline found – nothing to draw.");
    process.exit(1);
  }

  const bySource = (s: StartSource) => bars.filter((b) => b.issue.startSource === s).length;
  console.log(
    `  start dates: ${bySource("project field")} from project field, ` +
      `${bySource("first closing PR")} from first closing PR, ${bySource("issue creation")} from issue creation`
  );

  writeFileSync(OUT, renderSvg(`${OWNER}/${REPO}`, bars, today), "utf8");
  console.log(`✓ ${bars.length} bars written to ${OUT}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
