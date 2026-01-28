/* eslint-disable */
/* oxlint-disable */
// @ts-nocheck

// This script is served by Pleye, on /reporter.js of your instance.
// Downloaded at: 2026-01-28T16:51:04.603Z


/**
 * @import { Inputs } from '../routes/update/[repository]/inputs';
 * @import * as PW from '@playwright/test/reporter';
 * @typedef {Inputs['begin']['run']} RunData
 */

/**
 * @typedef {object} PleyeParams
 * @property {string} apiKey API Key to use
 * @property {string} serverOrigin Origin of the Pleye server, e.g. https://pleye.example.com
 * @property {number} repositoryGitHubId Github ID of the current repository
 * @property {number} githubJobId ID of the current GitHub job we're on
 * @property {string} commitSha Current commit SHA
 * @property {string} branch Current branch name
 * @property {number | undefined | null} [pullRequestNumber] Pull request number, if any
 */

/**
 * @implements {PW.Reporter}
 */
export default class Pleye {
	/** @type {string} */
	#apiKey;
	/** @type {string} */
	#serverOrigin;
	/** @type {number} */
	#repositoryGitHubId;
	/** @type {RunData} */
	#runData;

	/**
	 *
	 * @param {PleyeParams} params
	 */
	constructor(params) {
		const { apiKey, serverOrigin, repositoryGitHubId, ...runData } = params;
		this.#apiKey = apiKey;
		this.#serverOrigin = serverOrigin;
		this.#repositoryGitHubId = repositoryGitHubId;
		this.#runData = {
			startedAt: new Date(),
			...runData
		};
	}

	/**
	 *
	 * @param {PW.FullConfig} config
	 * @param {PW.Suite} suite
	 */
	onBegin(config, suite) {
		this.#sendPayload('begin', {
			run: this.#runData,
			projects: config.projects.map((project) => ({
				name: project.name,
				match: toArray(project.testMatch).map(String),
				ignore: toArray(project.testIgnore).map(String),
				timeoutMs: project.timeout
			}))
		});
	}

	/**
	 * @param {PW.FullResult} result
	 */
	onEnd(result) {
		this.#sendPayload('end', {
			status: 'completed',
			completedAt: new Date(),
			result: result.status,
			githubJobId: this.#runData.githubJobId
		});
	}

	// TODO: onError, onExit

	/**
	 *
	 * @param {PW.TestCase} test
	 * @param {PW.TestResult} result
	 * @param {PW.TestStep} step
	 * @returns
	 */
	onStepBegin(test, result, step) {
		if (step.steps.length > 0) {
			// We only care about "true" steps
			return;
		}

		this.#sendPayload('step-begin', {
			githubJobId: this.#runData.githubJobId,
			test: testIdentifierParams(test),
			step: {
				title: step.titlePath().at(-1) ?? '',
				path: step.titlePath().slice(0, -1),
				startedAt: step.startTime,
				annotations: step.annotations,
				category: toStepCategory(step.category),
				filePath: step.location?.file ?? null,
				locationInFile: step.location ? [step.location.line, step.location.column] : null
				// TODO: step.parent
				// parentStepId: step.parent
			}
		});
	}

	/**
	 *
	 * @param {PW.TestCase} test
	 * @param {PW.TestResult} result
	 * @param {PW.TestStep} step
	 */
	onStepEnd(test, result, step) {
		const stepIdentifier = stepIdentifierParams(test, step);
		if (!stepIdentifier) return;

		this.#sendPayload('step-end', {
			githubJobId: this.#runData.githubJobId,
			step: stepIdentifier,
			duration: toISOInterval(step.duration),
			error: step.error ? toError(step.error) : undefined
		});
	}

	/**
	 *
	 * @param {PW.TestCase} test
	 * @param {PW.TestResult} result
	 */
	onTestBegin(test, result) {
		const { title, path } = splitTitlePath(test.titlePath());

		const project = test.parent?.project();
		if (!project) {
			return;
		}

		this.#sendPayload('test-begin', {
			githubJobId: this.#runData.githubJobId,
			projectName: project.name,
			test: {
				title,
				path,
				tags: test.tags,
				filePath: test.location.file,
				locationInFile: [test.location.line, test.location.column],
				annotations: test.annotations
			},
			testrun: {
				timeoutMs: test.timeout,
				expectedStatus: test.expectedStatus,
				retriesLimit: test.retries,
				retries: result.retry,
				startedAt: result.startTime
			}
		});
	}

	/**
	 *
	 * @param {PW.TestCase} test
	 * @param {PW.TestResult} result
	 */
	onTestEnd(test, result) {
		this.#sendPayload('test-end', {
			githubJobId: this.#runData.githubJobId,
			test: testIdentifierParams(test),
			outcome: test.outcome(),
			stepsCount: result.steps.length || undefined,
			result: {
				duration: toISOInterval(result.duration),
				annotations: result.annotations,
				errors: result.errors.map(toError),
				retry: result.retry,
				startedAt: result.startTime,
				status: result.status,
				stdout: bufferToText(result.stdout),
				stderr: bufferToText(result.stderr)
			}
		});
	}

	/**
	 *
	 * @template {keyof Inputs} Event
	 * @param {Event} event
	 * @param {Inputs[Event]} payload
	 */
	#sendPayload(event, payload) {
		void fetch(`${this.#serverOrigin}/update/${this.#repositoryGitHubId}/${event}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.#apiKey}`
			},
			body: JSON.stringify(payload)
		});
	}
}

/**
 * @template T
 * @param {T | T[]} item
 * @returns {T[]}
 */
function toArray(item) {
	return Array.isArray(item) ? item : [item];
}

/**
 *
 * @param {string} category
 * @returns {Inputs['step-begin']['step']['category']}
 */
function toStepCategory(category) {
	switch (category) {
		case 'expect':
			return 'expect';
		case 'fixture':
			return 'fixture';
		case 'hook':
			return 'hook';
		case 'pw:api':
			return 'pw:api';
		case 'test.step':
			return 'test.step';
		case 'test.attach':
			return 'test.attach';
		default:
			return 'custom';
	}
}

/**
 *
 * @param {number} durationMs
 * @returns {string}
 */
function toISOInterval(durationMs) {
	const totalSeconds = Math.floor(durationMs / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const milliseconds = durationMs % 1000;

	return `PT${hours}H${minutes}M${seconds}.${milliseconds.toString().padStart(3, '0')}S`;
}

/**
 *
 * @param {PW.TestError} error
 * @returns {NonNullable<Inputs['step-end']['error']>}
 */
function toError(error) {
	const { location, message, stack, snippet } = climbToCauseError(error);
	return {
		message,
		stack,
		snippet,
		filePath: location?.file ?? null,
		locationInFile: location ? [location.line, location.column] : null
	};
}

/**
 *
 * @param {Array<string | Buffer>} writes
 * @returns {string}
 */
function bufferToText(writes) {
	return writes.map((chunk) => (Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : chunk)).join('');
}

/**
 *
 * @param {PW.TestError} error
 * @returns {PW.TestError}
 */
function climbToCauseError(error) {
	if (error.cause) {
		return climbToCauseError(error.cause);
	}

	return error;
}

/**
 *
 * @param {PW.TestCase} test
 * @param {PW.TestStep} step
 * @returns {import('../routes/update/[repository]/common').StepIdentifierParams | undefined}
 */
function stepIdentifierParams(test, step) {
	// TODO handle steps without location?
	if (!step.location) return;

	return {
		test: testIdentifierParams(test),
		filePath: step.location.file,
		...splitTitlePath(step.titlePath())
	};
}

/**
 *
 * @param {PW.TestCase} test
 * @returns {import('../routes/update/[repository]/common').TestIdentifierParams}
 */
function testIdentifierParams(test) {
	return {
		filePath: test.location.file,
		...splitTitlePath(test.titlePath())
	};
}

/**
 * @param {string[]} titlePath
 */
function splitTitlePath(titlePath) {
	const [_root, _project, _file, ...fullpath] = titlePath;
	return {
		title: fullpath.at(-1) ?? '',
		path: fullpath.slice(0, -1)
	};
}
