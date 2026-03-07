import { type } from 'arktype';
import { Estimation as ETA } from 'arrival-time';
import { formatDistanceToNowStrict, isValid as isValidDate } from 'date-fns';
import { Octokit } from 'octokit';

/**
 * Semi-open range [start=0, end)
 */
export function range(startOrEnd: number, end: number | undefined = undefined) {
	if (end === undefined) {
		return Array.from({ length: startOrEnd }, (_, i) => i);
	}
	return Array.from({ length: end - startOrEnd }, (_, i) => i + startOrEnd);
}

export const JSONPResponse = type('<T>', [
	[
		'string',
		'=>',
		(response) => JSON.parse(response.replace(new RegExp(`^[\\w_]+\\((.*)\\)$`), '$1'))
	],
	'|>',
	'T'
]);

// ANSI control sequences
class CC {
	static clearline = '\x1b[2K';
	static red = '\x1b[31m';
	static reset = '\x1b[0m';
	static dim = '\x1b[2m';
	static blue = '\x1b[34m';
	static bold = '\x1b[1m';
	static yellow = '\x1b[33m';
	static cyan = '\x1b[36m';
	static green = '\x1b[32m';
}

export function yellow(text: string): string {
	return `${CC.yellow}${text}${CC.reset}`;
}

export function cyan(text: string): string {
	return `${CC.cyan}${text}${CC.reset}`;
}

export function red(text: string): string {
	return `${CC.red}${text}${CC.reset}`;
}

export function bold(text: string): string {
	return `${CC.bold}${text}${CC.reset}`;
}

export function dim(text: string): string {
	return `${CC.dim}${text}${CC.reset}`;
}

export function percentage(part: number, total: number, precision = 0): string {
	return ((part / total) * 100).toFixed(precision).padStart(3 + precision, ' ') + '%';
}

export function align<T extends string | number>(num: T, total: T | T[]): string {
	const maxlen = Array.isArray(total)
		? Math.max(...total.map((t) => t.toString().length))
		: total.toString().length;

	// right-align numbers, left-align strings
	if (typeof num === 'number') {
		return num.toString().padStart(maxlen);
	} else {
		return num.toString().padEnd(maxlen);
	}
}

export function chunkBySize<T>(by: number, items: T[]): T[][] {
	return new Array(Math.ceil(items.length / by))
		.fill([])
		.map((_, i) => items.slice(i * by, (i + 1) * by));
}

let gh: undefined | Octokit;
const checkruns = new Map<
	string,
	{ githubId: number; step?: string; progressPercent?: number; name: string }
>();

export async function updateCheckrunProgress(
	id: 'protocols',
	done: number,
	total: number,
	eta: ETA
) {
	const percentage = Math.round((done / total) * 100);
	const perc = percentage.toString().padStart(3);

	if (checkruns.get(id)!.progressPercent == percentage) return;

	const arrivalDate = new Date(Date.now() + eta.estimate());
	const time = isValidDate(arrivalDate)
		? formatDistanceToNowStrict(arrivalDate, { addSuffix: true })
		: 'No ETA';

	await emitCheckrun(id, 'in_progress', null, `${time} | ${perc}%`);

	checkruns.set(id, {
		...checkruns.get(id)!,
		progressPercent: percentage
	});
}

export async function emitCheckrun(
	id: 'protocols',
	status: 'in_progress' | 'queued' | 'completed',
	/** DONT set to null on the first emit */
	step: string | null,
	details: string
) {
	if (!process.env.GH_TOKEN && process.env.CI) {
		console.warn('GH_TOKEN env variable not set, cannot emit check runs');
		return;
	}

	gh ??= new Octokit({ auth: process.env.GH_TOKEN });
	const [owner, repo] = process.env.GITHUB_REPOSITORY!.split('/');

	let name = 'Status';

	if (process.env.GH_CHECK_RUN_ID && !checkruns.has(id)) {
		const { data: checkrun } = await gh.request(
			'GET /repos/{owner}/{repo}/check-runs/{check_run_id}',
			{
				owner,
				repo,
				check_run_id: Number.parseInt(process.env.GH_CHECK_RUN_ID)
			}
		);

		const { data: job } = await gh.request('GET /repos/{owner}/{repo}/actions/jobs/{job_id}', {
			owner,
			repo,
			job_id: checkrun.id
		});

		name = `${job.workflow_name} / ${checkrun.name} (progress)`;

		const {
			data: { check_runs: currentCheckruns }
		} = await gh.request('GET /repos/{owner}/{repo}/commits/{ref}/check-runs', {
			owner,
			repo,
			ref: process.env.GITHUB_SHA!
		});

		const matchingCheckrun = currentCheckruns.find(
			(c) => c.output.text === `custom-checkrun-${id}`
		);
		if (matchingCheckrun) {
			checkruns.set(id, {
				githubId: matchingCheckrun.id,
				name
			});
		}
	}

	const existing = checkruns.get(id);

	try {
		if (existing) {
			step ||= existing.step ?? '';

			await gh.request('PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}', {
				owner,
				repo,
				check_run_id: existing.githubId,
				status,
				conclusion: status === 'completed' ? 'success' : undefined,
				output: {
					title: `${details} (${step})`,
					summary: '',
					text: `custom-checkrun-${id}`
				}
			});

			checkruns.set(id, { ...existing, step });
		} else {
			console.debug(`Creating a checkrun with`, { name, step, details });

			const response = await gh.request('POST /repos/{owner}/{repo}/check-runs', {
				head_sha: process.env.GITHUB_SHA!,
				owner,
				repo,
				name,
				status,
				output: {
					title: `${details} (${step})`,
					summary: '',
					text: `custom-checkrun-${id}`
				}
			});

			checkruns.set(id, {
				githubId: response.data.id,
				step: step!,
				name
			});
		}
	} catch (error) {
		console.error(
			`Couldn't emit a checkrun with`,
			{ id, status, step, details, existing },
			':',
			error
		);
	}
}
