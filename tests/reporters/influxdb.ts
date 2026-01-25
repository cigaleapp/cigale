/* eslint-disable */

import { InfluxDB, Point } from '@influxdata/influxdb-client';
import type {
	FullConfig,
	FullResult,
	Reporter,
	Suite,
	TestCase,
	TestResult
} from '@playwright/test/reporter';
import arkenv from 'arkenv';

const env = arkenv({
	INFLUXDB_URL: 'string',
	INFLUXDB_TOKEN: 'string',
	INFLUXDB_ORG: 'string',
	INFLUXDB_BUCKET: 'string'
});

class InfluxDb {
	readonly writeApi;

	constructor() {
		this.writeApi = new InfluxDB({ url: env.INFLUXDB_URL, token: env.INFLUXDB_TOKEN }).getWriteApi(
			env.INFLUXDB_ORG,
			env.INFLUXDB_BUCKET
		);
	}

	async writeMeasurement(point: Point) {
		this.writeApi.writePoint(point);
	}

	async closeApi() {
		await this.writeApi.close().then(() => {
			console.info('WRITE FINISHED');
		});
	}
}
const influx = new InfluxDb();

class InfluxDBReporter implements Reporter {
	count = { total: 0, passed: 0, failed: 0, skipped: 0 };
	arr_err: any = [];
	onBegin(config: FullConfig, suite: Suite) {
		this.count['total'] = suite.allTests().length;
	}

	onTestBegin(test: TestCase, result: TestResult) {}

	async onTestEnd(test: TestCase, result: TestResult) {
		await this.collectStatus(result);
	}

	async onEnd(result: FullResult) {
		//time duration to execute
		console.info(`Total duration: ${result.duration}`);
		if (this.count['failed'] > 0) {
			this.arr_err.map(function (e: any) {
				console.info(e[0]['message']);
			});
		}
		//add the point for influx db
		const status = new Point('QA')
			.tag('Status', 'UI Cases')
			.intField('Total', this.count['total'])
			.intField('Passed', this.count['passed'])
			.intField('Failed', this.count['failed'])
			.intField('Skipped', this.count['skipped']);
		await influx.writeMeasurement(status);

		//add the time duration
		const duration = new Point('QA')
			.tag('Duration', 'time')
			.floatField('Time', result.duration);
		await influx.writeMeasurement(duration);

		await influx.closeApi();
	}

	async collectStatus(status: TestResult) {
		switch (status.status) {
			case 'failed':
			case 'timedOut':
				this.count['failed'] += 1;
				this.arr_err.push(status.errors);
				break;
			case 'skipped':
				this.count['skipped'] += 1;
				break;
			case 'passed':
				this.count['passed'] += 1;
				break;
		}
	}
}

export default InfluxDBReporter;
