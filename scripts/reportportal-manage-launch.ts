import RPReporter from '@reportportal/agent-js-playwright';
import RPClient from '@reportportal/client-javascript';
import arkenv from 'arkenv';
import { type } from 'arktype';

type ReportPortalConfig = RPReporter['config'];

const env = arkenv({
	REPORTPORTAL_API_KEY: 'string',
	REPORTPORTAL_DOMAIN: 'string',
	GIT_BRANCH: 'string ',
	RUN_ID: 'string ',
	RUN_URL: 'string.url'
});

const command = type.or(['"start"'], ['"finish"', 'string'])(process.argv.slice(2));

const config: ReportPortalConfig = {
	apiKey: env.REPORTPORTAL_API_KEY,
	endpoint: `https://${env.REPORTPORTAL_DOMAIN}/api/v2`,
	project: 'CIGALE',
	launch: env.GIT_BRANCH,
	description: `Playwright E2E tests, run at ${env.RUN_URL}`,
	attributes: [{ key: 'run_id', value: env.RUN_ID || 'unknown' }]
};

const client = new RPClient(config, {});

switch (command[0]) {
	case 'start': {
		const response = await client.startLaunch({
			name: config.launch,
			attributes: config.attributes,
			description: config.description
		}).promise;

		console.info(response.id);
		break;
	}

	case 'finish': {
		const launchId = command[1];

		const tempId = client.startLaunch({ id: launchId }).tempId;
		await client.finishLaunch(tempId, {}).promise;
	}
}
