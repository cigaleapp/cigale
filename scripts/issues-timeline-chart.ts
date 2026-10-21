#!/usr/bin/env tsx
/**
 * Generates a timeline (gantt-style) HTML page from the issues of a GitHub repo.
 *
 * Which issues become bars:
 *   every issue of the repo that is CLOSED, or has a "Deadline" issue field set
 *   (issues closed as "not planned" / duplicate are ignored, see INCLUDE_NOT_PLANNED)
 *
 * Bar start (first one that exists wins):
 *   1. issue field "Start"
 *   2. earliest creation date of the pull requests that close the issue
 *   3. the issue's own creation date
 *
 * Bar end:
 *   issue closedAt (if closed)  OR  issue field "Deadline"
 *
 * The page is interactive: it opens on a 12-month window centered on today. Zoom with the
 * buttons, + / - keys, or Ctrl/⌘ + mouse wheel (pinch on a trackpad); pan by scrolling or dragging.
 *
 * Setup (no runtime dependencies):
 *   npm i -D tsx typescript @types/node
 *
 * Usage:
 *   export GITHUB_TOKEN=ghp_xxx          # or be logged in with `gh auth login`
 *   npx tsx timeline.ts <owner/repo> [output.html]
 *
 * Example:
 *   npx tsx timeline.ts my-org/my-repo timeline.html
 *
 * Optional env vars:
 *   START_FIELD         name of the start date issue field     (default "Start")
 *   DEADLINE_FIELD      name of the deadline date issue field  (default "Deadline")
 *   SINCE=2026-01-01    drop bars that end before this date (handy for big repos)
 *   UNTIL=2026-12-31    hard right edge of the chart. Bars that run past it are cut off there
 *                       and show their real end date written on the bar. Bars that start after
 *                       it are dropped.
 *   VIEW_MONTHS=12      how many months are visible when the page opens (default 12)
 *   INCLUDE_NOT_PLANNED=1   also draw issues closed as "not planned" / duplicate
 *
 * Token: classic PAT with `repo`, or a fine-grained PAT with Issues: read and Pull requests: read.
 * `gh` CLI users: just `gh auth login`.
 * Issue fields are a preview feature (the script sends the `GraphQL-Features: issue_fields` header).
 *
 * Requires Node 18+ (global fetch).
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

// eslint-disable @typescript-eslint/no-explicit-any

// ───────────────────────────── config ─────────────────────────────

const [repoArg, outArg] = process.argv.slice(2);
if (!repoArg || !repoArg.includes('/')) {
	console.error('Usage: npx tsx timeline.ts <owner/repo> [output.html]');
	process.exit(1);
}
const [OWNER, REPO] = repoArg.split('/');

const OUT = outArg ?? 'timeline.html';

const START_FIELD = process.env.START_FIELD ?? 'Start';
const DEADLINE_FIELD = process.env.DEADLINE_FIELD ?? 'Deadline';
const SINCE = process.env.SINCE ? new Date(process.env.SINCE + 'T00:00:00Z') : null;
const UNTIL = process.env.UNTIL ? new Date(process.env.UNTIL + 'T00:00:00Z') : null;
const VIEW_MONTHS = Number(process.env.VIEW_MONTHS ?? 12);
const INCLUDE_NOT_PLANNED = process.env.INCLUDE_NOT_PLANNED === '1';

// ───────────────────────────── auth ─────────────────────────────

function getToken(): string {
	const env = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
	if (env) return env;
	try {
		return execSync('gh auth token', { stdio: ['ignore', 'pipe', 'ignore'] })
			.toString()
			.trim();
	} catch {
		console.error(
			'No GitHub token found. Set GITHUB_TOKEN (classic PAT with `repo`) ' +
				'or log in with the GitHub CLI: `gh auth login`.'
		);
		process.exit(1);
	}
}

// ───────────────────────────── GitHub API ─────────────────────────────

type StartSource = 'issue field' | 'first closing PR' | 'issue creation';

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
				pageInfo {
					hasNextPage
					endCursor
				}
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
								field {
									... on IssueFieldDate {
										name
									}
								}
							}
						}
					}
					closedByPullRequestsReferences(first: 20, includeClosedPrs: true) {
						nodes {
							createdAt
						}
					}
				}
			}
		}
	}
`;

/** Accepts "2026-04-15" or a full ISO timestamp. */
function parseDate(v: string): Date {
	return new Date(v.includes('T') ? v : v + 'T00:00:00Z');
}

async function gql(token: string, variables: object) {
	const res = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			'User-Agent': 'repo-timeline-script',
			'GraphQL-Features': 'issue_fields', // required to read issue fields (preview)
		},
		body: JSON.stringify({ query: QUERY, variables }),
	});
	if (res.status === 401) throw new Error('401 Unauthorized – check your token.');
	if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);
	return (await res.json()) as { data?: any; errors?: { type?: string; message: string }[] };
}

async function fetchIssues(token: string): Promise<Issue[]> {
	const issues: Issue[] = [];
	let cursor: string | null = null;
	let scanned = 0;
	let notPlanned = 0;

	for (;;) {
		const json = await gql(token, { owner: OWNER, name: REPO, cursor });
		if (json.errors?.length) {
			if (json.errors.every((e) => e.type === 'NOT_FOUND')) {
				throw new Error(
					`Repository ${OWNER}/${REPO} not found (or your token can't see it).`
				);
			}
			throw new Error(json.errors.map((e) => e.message).join('\n'));
		}
		const page = json.data.repository.issues;

		for (const n of page.nodes) {
			scanned++;
			const closed = n.state === 'CLOSED';

			// issue-level date fields ("Start", "Deadline")
			let deadline: Date | null = null;
			let fieldStart: Date | null = null;
			for (const fv of n.issueFieldValues?.nodes ?? []) {
				if (fv.__typename !== 'IssueFieldDateValue' || !fv.value) continue;
				if (fv.field?.name === DEADLINE_FIELD) deadline = parseDate(fv.value);
				if (fv.field?.name === START_FIELD) fieldStart = parseDate(fv.value);
			}

			// selection: closed OR has a deadline
			if (!closed && !deadline) continue;

			// closed as "not planned" / duplicate -> ignored unless asked for
			if (
				closed &&
				(n.stateReason === 'NOT_PLANNED' || n.stateReason === 'DUPLICATE') &&
				!INCLUDE_NOT_PLANNED
			) {
				notPlanned++;
				continue;
			}

			// start date, in order of preference
			let start: Date | null = fieldStart;
			let startSource: StartSource = fieldStart ? 'issue field' : 'issue creation';

			if (!start) {
				const prDates: Date[] = (n.closedByPullRequestsReferences?.nodes ?? [])
					.filter(Boolean)
					.map((pr: { createdAt: string }) => new Date(pr.createdAt));
				if (prDates.length) {
					start = new Date(Math.min(...prDates.map((d) => d.getTime())));
					startSource = 'first closing PR';
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
	console.info(
		`\r  scanned ${scanned} issues, ${issues.length} selected, ${notPlanned} "not planned" ignored`
	);
	return issues;
}

// ───────────────────────────── rendering ─────────────────────────────

const DAY = 86_400_000;

interface Bar {
	issue: Issue;
	start: Date;
	end: Date;
	kind: 'closed' | 'open' | 'overdue';
}

function buildBars(issues: Issue[], today: Date): Bar[] {
	const bars: Bar[] = [];
	for (const issue of issues) {
		let end: Date;
		let kind: Bar['kind'];
		if (issue.closed && issue.closedAt) {
			end = issue.closedAt;
			kind = 'closed';
		} else {
			end = issue.deadline!; // guaranteed by the selection filter
			kind = end < today ? 'overdue' : 'open';
		}
		if (SINCE && end < SINCE) continue;
		if (UNTIL && issue.start > UNTIL) continue;
		// never let a bar be shorter than one day (or negative)
		if (end.getTime() < issue.start.getTime() + DAY)
			end = new Date(issue.start.getTime() + DAY);
		bars.push({ issue, start: issue.start, end, kind });
	}
	return bars.sort(
		(a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime()
	);
}

const esc = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (d: Date) =>
	d.toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: 'UTC',
	});

const LABEL_W = 380;

/** Runs in the browser: builds the rows once, then re-positions everything on zoom. */
const CLIENT_JS = String.raw`
(function () {
  var D = JSON.parse(document.getElementById("data").textContent);
  var DAY = 864e5, MONTH_DAYS = 30.4375, LABEL_W = D.labelW, MAX_PPM = 1200;
  var root = document.documentElement;
  var bars = D.bars, today = D.today, limit = D.limit, viewMonths = D.viewMonths;

  function clip(ms) { return limit !== null && ms > limit ? limit : ms; }
  function fmt(ms) {
    return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  }

  // full scrollable domain: all bars, plus enough room around today for the default window
  var half = viewMonths * MONTH_DAYS / 2 * DAY;
  var lo = Math.min.apply(null, bars.map(function (b) { return b.s; }).concat([today - half])) - 7 * DAY;
  var hi = limit !== null ? limit
    : Math.max.apply(null, bars.map(function (b) { return clip(b.e); }).concat([today + half])) + 7 * DAY;
  var domainDays = (hi - lo) / DAY;

  var ppm = 100; // zoom level, in pixels per month
  function ppd() { return ppm / MONTH_DAYS; }
  function x(ms) { return (ms - lo) / DAY * ppd(); }
  function chartW() { return domainDays * ppd(); }
  function viewW() { return Math.max(root.clientWidth - LABEL_W, 200); }
  function minPpm() { return viewW() / (domainDays / MONTH_DAYS); }
  function clampPpm(v) { return Math.min(MAX_PPM, Math.max(minPpm(), v)); }

  // ---- build rows (once) ----
  var rowsEl = document.getElementById("rows");
  var linesEl = document.getElementById("lines");
  var ticksEl = document.getElementById("ticks");
  var todayLine = document.getElementById("todayline");
  var todayLabel = document.getElementById("todaylabel");
  var viewInfo = document.getElementById("viewinfo");

  var frag = document.createDocumentFragment();
  var recs = bars.map(function (b, i) {
    var row = document.createElement("div");
    row.className = "row" + (i % 2 === 0 ? " alt" : "");

    var label = document.createElement("a");
    label.className = "label";
    label.href = b.u; label.target = "_blank"; label.rel = "noopener";
    label.textContent = "#" + b.n + " " + b.t;
    label.title = "#" + b.n + " " + b.t;

    var track = document.createElement("div");
    track.className = "track";

    var bar = document.createElement("a");
    bar.className = "bar " + b.k;
    bar.href = b.u; bar.target = "_blank"; bar.rel = "noopener";
    bar.title = ["#" + b.n + ": " + b.t,
      fmt(b.s) + " \u2192 " + fmt(b.e),
      "Start from: " + b.ss,
      b.d !== null ? "Deadline: " + fmt(b.d) : null,
      b.c ? "Closed" : "Open"].filter(Boolean).join("\n");
    track.appendChild(bar);

    var endEl = document.createElement("span");
    endEl.className = "endlabel"; endEl.hidden = true;
    track.appendChild(endEl);

    var dia = null;
    if (b.k === "closed" && b.d !== null) {
      dia = document.createElement("span");
      dia.className = "dia";
      dia.title = "Deadline: " + fmt(b.d);
      track.appendChild(dia);
    }

    row.appendChild(label); row.appendChild(track);
    frag.appendChild(row);
    return { b: b, bar: bar, endEl: endEl, dia: dia };
  });
  rowsEl.appendChild(frag);

  // ---- layout: positions everything for the current zoom level ----
  var presetBtns = Array.prototype.slice.call(document.querySelectorAll("button[data-m]"));

  function layout() {
    var w = chartW();
    root.style.setProperty("--chartW", w + "px");

    recs.forEach(function (r) {
      var b = r.b;
      var bx = x(b.s), bw = Math.max(x(clip(b.e)) - bx, 3);
      r.bar.style.left = bx + "px";
      r.bar.style.width = bw + "px";

      if (limit !== null && b.e > limit) {
        // bar runs past the chart's hard edge -> write its real end date on it
        var text = "\u2192 " + fmt(b.e);
        if (bw >= text.length * 6.3 + 14) {
          r.bar.textContent = text; r.endEl.hidden = true;
        } else {
          r.bar.textContent = "";
          r.endEl.hidden = false; r.endEl.textContent = text;
          r.endEl.style.right = (w - bx + 6) + "px";
        }
      }
      if (r.dia) {
        r.dia.hidden = b.d > hi;
        r.dia.style.left = x(b.d) + "px";
      }
    });

    // grid lines + month / quarter / year labels, depending on zoom
    var lines = document.createDocumentFragment();
    var ticks = document.createDocumentFragment();

    if (ppd() >= 5) { // weekly minor lines (Mondays)
      var d0 = Math.ceil(lo / DAY) * DAY;
      while (((d0 / DAY) + 4) % 7 !== 1) d0 += DAY;
      for (var wk = d0; wk <= hi; wk += 7 * DAY) {
        var m = document.createElement("div");
        m.className = "gridline minor"; m.style.left = x(wk) + "px";
        lines.appendChild(m);
      }
    }

    var step = ppm >= 60 ? 1 : ppm >= 20 ? 3 : 12;
    var d = new Date(lo);
    var mo = step === 12 ? 0 : step === 3 ? d.getUTCMonth() - (d.getUTCMonth() % 3) : d.getUTCMonth();
    var t = Date.UTC(d.getUTCFullYear(), mo, 1);
    while (t <= hi) {
      if (t >= lo) {
        var g = document.createElement("div");
        g.className = "gridline"; g.style.left = x(t) + "px";
        lines.appendChild(g);

        var tk = document.createElement("div");
        tk.className = "tick"; tk.style.left = x(t) + "px";
        tk.textContent = step === 12 ? String(new Date(t).getUTCFullYear())
          : new Date(t).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
        ticks.appendChild(tk);
      }
      var dd = new Date(t);
      t = Date.UTC(dd.getUTCFullYear(), dd.getUTCMonth() + step, 1);
    }
    linesEl.textContent = ""; linesEl.appendChild(lines);
    ticksEl.textContent = ""; ticksEl.appendChild(ticks);

    var showToday = today >= lo && today <= hi;
    todayLine.hidden = todayLabel.hidden = !showToday;
    if (showToday) {
      todayLine.style.left = x(today) + "px";
      todayLabel.style.left = (x(today) + 4) + "px";
    }

    var visible = viewW() / ppm;
    viewInfo.textContent = "showing ~" + (Math.round(visible * 10) / 10) + " months";
    presetBtns.forEach(function (btn) {
      btn.classList.toggle("active", Math.abs(visible - Number(btn.dataset.m)) < Number(btn.dataset.m) * 0.04);
    });
  }

  // ---- zoom & scroll ----
  // Rows are sorted by start date, so zooming to another point in time usually means the
  // relevant rows are somewhere else vertically. We pick the vertical position that shows
  // the most bars overlapping the visible time window ("bar density"), rather than simply the
  // first overlapping row (which is often a long-running issue sitting far above the action).
  function rowH() { return (recs.length && recs[0].bar.parentNode.parentNode.offsetHeight) || 28; }
  function headerH() { return document.querySelector(".top").offsetHeight + document.querySelector(".axis").offsetHeight; }
  function rowsTop() { return rowsEl.getBoundingClientRect().top + window.scrollY; }
  function timeWindow(left) { return [lo + left / ppd() * DAY, lo + (left + viewW()) / ppd() * DAY]; }
  function visibleRows() { return Math.max(1, Math.floor((window.innerHeight - headerH()) / rowH())); }

  // prefix[i] = number of rows before i whose bar overlaps the time window
  function prefixCounts(left) {
    var w = timeWindow(left), p = [0];
    for (var i = 0; i < recs.length; i++) {
      var b = recs[i].b;
      p.push(p[i] + (clip(b.e) >= w[0] && b.s <= w[1] ? 1 : 0));
    }
    return p;
  }
  // best vertical slice: scrollTop that maximizes bars in view (-1 if the window holds no bars).
  // With "must" (a row index), only slices that include that row are considered.
  function bestSlice(left, must) {
    var p = prefixCounts(left), n = recs.length, N = visibleRows();
    var hasMust = must !== undefined && must >= 0;
    var from = 0, to = Math.max(0, n - N);
    if (hasMust) { from = Math.max(0, must - N + 1); to = Math.min(to, must); }
    var best = -1, bi = from;
    for (var i = from; i <= to; i++) {
      var c = p[Math.min(n, i + N)] - p[i];
      if (c > best) { best = c; bi = i; }
    }
    if (best <= 0 && !hasMust) return { top: -1, count: 0 };
    var stop = hasMust ? must : n - 1;
    if (best > 0) while (bi < stop && p[bi + 1] === p[bi]) bi++; // don't start on rows with no bar in the window
    return { top: Math.max(0, rowsTop() + bi * rowH() - headerH()), count: Math.max(best, 0) };
  }
  // bars in view at the current vertical scroll position
  function currentCount(left) {
    var p = prefixCounts(left), n = recs.length;
    var i0 = Math.min(n, Math.max(0, Math.floor((window.scrollY + headerH() - rowsTop()) / rowH())));
    return p[Math.min(n, i0 + visibleRows())] - p[i0];
  }

  function setPpm(newPpm, ax) {
    if (ax === undefined) ax = LABEL_W + viewW() / 2;
    ax = Math.max(ax, LABEL_W);
    var anchorMs = lo + (window.scrollX + ax - LABEL_W) / ppd() * DAY; // date under the cursor
    ppm = clampPpm(newPpm);
    layout();
    var left = x(anchorMs) - (ax - LABEL_W);
    var top = window.scrollY;
    // keep the vertical position while it still shows a decent share of the possible bars,
    // otherwise follow the zoom to the densest spot
    var best = bestSlice(left);
    if (best.top >= 0 && currentCount(left) < 0.7 * best.count) top = best.top;
    window.scrollTo(left, top);
  }
  // the most recently closed issue (by close date): the "Today" views always keep its row on screen
  var latestClosed = -1;
  recs.forEach(function (r, i) {
    if (r.b.k === "closed" && (latestClosed < 0 || r.b.e >= recs[latestClosed].b.e)) latestClosed = i;
  });

  // jump to today: center it horizontally, bring the densest rows into view,
  // and make sure the latest closed issue is visible
  function centerOn(ms, smooth) {
    var c = Math.min(Math.max(ms, lo), hi);
    var left = x(c) - viewW() / 2;
    var t = bestSlice(left, latestClosed).top;
    window.scrollTo({ left: left, top: t >= 0 ? t : window.scrollY, behavior: smooth ? "smooth" : "auto" });
  }

  presetBtns.forEach(function (btn) {
    btn.addEventListener("click", function () { setPpm(viewW() / Number(btn.dataset.m)); centerOn(today); });
  });
  document.getElementById("zin").addEventListener("click", function () { setPpm(ppm * 1.4); });
  document.getElementById("zout").addEventListener("click", function () { setPpm(ppm / 1.4); });
  document.getElementById("all").addEventListener("click", function () {
    setPpm(minPpm()); window.scrollTo(0, 0);
  });
  document.getElementById("todaybtn").addEventListener("click", function () { centerOn(today, true); });

  // Ctrl/Cmd + wheel (also trackpad pinch) zooms around the cursor; plain wheel scrolls as usual
  var pend = 1, pax = 0, raf = 0;
  window.addEventListener("wheel", function (e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    pend *= Math.exp(-e.deltaY * 0.002); pax = e.clientX;
    if (!raf) raf = requestAnimationFrame(function () {
      raf = 0; var f = pend; pend = 1; setPpm(ppm * f, pax);
    });
  }, { passive: false });

  window.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "+" || e.key === "=") setPpm(ppm * 1.4);
    else if (e.key === "-" || e.key === "_") setPpm(ppm / 1.4);
  });

  // drag to pan (mouse only; touch already scrolls natively)
  var drag = null;
  rowsEl.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "mouse" || e.button !== 0 || e.target.closest("a")) return;
    drag = { x: e.clientX, y: e.clientY, sx: window.scrollX, sy: window.scrollY };
    document.body.classList.add("dragging");
  });
  window.addEventListener("pointermove", function (e) {
    if (drag) window.scrollTo(drag.sx - (e.clientX - drag.x), drag.sy - (e.clientY - drag.y));
  });
  function endDrag() { drag = null; document.body.classList.remove("dragging"); }
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  // ---- init: viewMonths around today ----
  function setVw() { root.style.setProperty("--vw", root.clientWidth + "px"); }
  window.addEventListener("resize", function () { setVw(); ppm = clampPpm(ppm); layout(); });
  setVw();
  ppm = clampPpm(viewW() / viewMonths);
  layout();
  centerOn(today);
})();
`;

function renderHtml(title: string, bars: Bar[], today: Date): string {
	const data = {
		labelW: LABEL_W,
		today: today.getTime(),
		limit: UNTIL ? UNTIL.getTime() : null,
		viewMonths: VIEW_MONTHS,
		bars: bars.map((b) => ({
			n: b.issue.number,
			t: b.issue.title,
			u: b.issue.url,
			k: b.kind,
			c: b.issue.closed,
			s: b.start.getTime(),
			e: b.end.getTime(),
			d: b.issue.deadline ? b.issue.deadline.getTime() : null,
			ss: b.issue.startSource,
		})),
	};
	// keep "</script>" etc. inside titles from terminating the JSON block
	const json = JSON.stringify(data).replace(/</g, '\\u003c');

	const range = (SINCE ? `from ${fmt(SINCE)} ` : '') + (UNTIL ? `until ${fmt(UNTIL)}` : '');

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${esc(title)} – timeline</title>
<style>
  :root {
    --labelW: ${LABEL_W}px; --chartW: 0px; --rowH: 28px; --topH: 80px; --axisH: 30px;
    --bg:#ffffff; --fg:#1f2328; --muted:#656d76; --grid:#d8dee4; --row:#f6f8fa;
    --closed:#8250df; --open:#0969da; --overdue:#cf222e; --today:#bf8700;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg:#0d1117; --fg:#e6edf3; --muted:#8b949e; --grid:#30363d; --row:#161b22;
      --closed:#a371f7; --open:#4493f8; --overdue:#f85149; --today:#d29922;
    }
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { background: var(--bg); color: var(--fg); font: 13px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  body.dragging, body.dragging * { cursor: grabbing !important; user-select: none; }

  .canvas { width: max-content; min-width: 100%; }

  /* top area: sticky vertically; its content also stays put when scrolling horizontally */
  .top { position: sticky; top: 0; z-index: 30; height: var(--topH); background: var(--bg); }
  .top-inner { position: sticky; left: 0; width: var(--vw, 100vw); padding: 14px 20px 0;
               display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
  h1 { margin: 0 0 8px; font-size: 18px; font-weight: 600; }
  .legend { display: flex; flex-wrap: wrap; gap: 4px 18px; align-items: center; color: var(--muted); font-size: 12px; }
  .legend i { display: inline-block; width: 14px; height: 10px; border-radius: 2px; margin-right: 6px; vertical-align: -1px; }
  .legend i.closed { background: var(--closed); }
  .legend i.open { background: var(--open); }
  .legend i.overdue { background: var(--overdue); }
  .legend i.dia { width: 8px; height: 8px; border-radius: 0; transform: rotate(45deg); background: var(--fg); margin: 0 8px 0 3px; }

  .right { flex: none; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
  .controls { display: flex; gap: 6px; align-items: center; }
  .controls .sep { width: 1px; height: 18px; background: var(--grid); margin: 0 4px; }
  button { font: inherit; font-size: 12px; color: var(--fg); background: var(--row); border: 1px solid var(--grid);
           border-radius: 6px; padding: 2px 9px; cursor: pointer; }
  button:hover { border-color: var(--muted); }
  button.active { background: var(--open); border-color: var(--open); color: #fff; }
  .hint { color: var(--muted); font-size: 11px; }

  /* month axis: sticky below the top area */
  .axis { position: sticky; top: var(--topH); z-index: 20; display: flex; height: var(--axisH);
          background: var(--bg); border-bottom: 1px solid var(--grid); }
  .corner { flex: none; width: var(--labelW); position: sticky; left: 0; z-index: 25; background: var(--bg); border-right: 1px solid var(--grid); }
  .track { position: relative; flex: none; width: var(--chartW); }
  .tick { position: absolute; top: 9px; padding-left: 4px; color: var(--muted); font-size: 12px; white-space: nowrap; }
  .todaylabel { position: absolute; bottom: 2px; color: var(--today); font-size: 11px; font-weight: 600; }

  /* rows: issue titles stay put when scrolling horizontally */
  .rows { position: relative; cursor: grab; }
  .row { display: flex; height: var(--rowH); background: var(--bg); }
  .row.alt { background: var(--row); }
  .label { flex: none; width: var(--labelW); position: sticky; left: 0; z-index: 15; background: inherit;
           padding: 0 12px 0 20px; line-height: var(--rowH); overflow: hidden; text-overflow: ellipsis;
           white-space: nowrap; color: inherit; text-decoration: none; border-right: 1px solid var(--grid); cursor: pointer; }
  .label:hover { text-decoration: underline; }

  .grid { position: absolute; top: 0; bottom: 0; left: var(--labelW); width: var(--chartW); z-index: 1; pointer-events: none; }
  #lines { position: absolute; inset: 0; }
  .gridline { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--grid); }
  .gridline.minor { opacity: .45; }
  .todayline { position: absolute; top: 0; bottom: 0; width: 0; border-left: 2px dashed var(--today); }

  .bar { position: absolute; z-index: 2; top: calc((var(--rowH) - 16px) / 2); height: 16px; min-width: 3px;
         border-radius: 3px; overflow: hidden; white-space: nowrap; text-align: right; padding-right: 6px;
         color: #fff; font-size: 11px; font-weight: 600; line-height: 16px; text-decoration: none; cursor: pointer; }
  .bar:hover { filter: brightness(1.15); }
  .bar.closed { background: var(--closed); }
  .bar.open { background: var(--open); }
  .bar.overdue { background: var(--overdue); }
  .endlabel { position: absolute; z-index: 2; top: 0; line-height: var(--rowH); color: var(--muted); font-size: 11px; white-space: nowrap; }
  .dia { position: absolute; z-index: 3; top: calc((var(--rowH) - 8px) / 2); width: 8px; height: 8px; margin-left: -4px;
         background: var(--fg); transform: rotate(45deg); }
  [hidden] { display: none !important; }
  .bottom { height: 24px; }
</style>
</head>
<body>
<div class="canvas">
  <div class="top">
    <div class="top-inner">
      <div>
        <h1>${esc(title)} – timeline</h1>
        <div class="legend">
          <span><i class="closed"></i>Closed (ends at close date)</span>
          <span><i class="open"></i>Open (ends at deadline)</span>
          <span><i class="overdue"></i>Open, past deadline</span>
          <span><i class="dia"></i>Deadline (on closed issues)</span>
          <span>${bars.length} issues${range ? ' · ' + esc(range) : ''} · <span id="viewinfo"></span></span>
        </div>
      </div>
      <div class="right">
        <div class="controls">
          <button data-m="3">3 mo</button>
          <button data-m="6">6 mo</button>
          <button data-m="12">12 mo</button>
          <button data-m="24">24 mo</button>
          <button id="all">All</button>
          <span class="sep"></span>
          <button id="zout" title="Zoom out (−)">−</button>
          <button id="zin" title="Zoom in (+)">+</button>
          <button id="todaybtn">Today</button>
        </div>
        <div class="hint">Ctrl/⌘ + scroll or pinch to zoom · drag or scroll to pan</div>
      </div>
    </div>
  </div>
  <div class="axis">
    <div class="corner"></div>
    <div class="track"><div id="ticks"></div><div class="todaylabel" id="todaylabel" hidden>today</div></div>
  </div>
  <div class="rows" id="rows">
    <div class="grid"><div id="lines"></div><div class="todayline" id="todayline" hidden></div></div>
  </div>
  <div class="bottom"></div>
</div>
<script type="application/json" id="data">${json}</script>
<script>${CLIENT_JS}</script>
</body>
</html>
`;
}

// ───────────────────────────── main ─────────────────────────────

async function main() {
	const token = getToken();
	console.info(`Fetching issues of ${OWNER}/${REPO}…`);
	const issues = await fetchIssues(token);

	const now = new Date();
	const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
	const bars = buildBars(issues, today);
	if (!bars.length) {
		console.error('No closed issues or issues with a deadline found – nothing to draw.');
		process.exit(1);
	}

	const bySource = (s: StartSource) => bars.filter((b) => b.issue.startSource === s).length;
	console.info(
		`  start dates: ${bySource('issue field')} from issue field, ` +
			`${bySource('first closing PR')} from first closing PR, ${bySource('issue creation')} from issue creation`
	);

	writeFileSync(OUT, renderHtml(`${OWNER}/${REPO}`, bars, today), 'utf8');
	console.info(`✓ ${bars.length} bars written to ${OUT}`);
}

main().catch((e) => {
	console.error(e instanceof Error ? e.message : e);
	process.exit(1);
});
