import type { HardwareRequirements, Requirement } from './schemas/constraints.js';
import type { UnitsByMeasure } from 'convert';

import { Capacitor } from '@capacitor/core';
import { DeviceInfo as CapacitorDeviceInfo } from '@capawesome/capacitor-device-info';
import convert, { MeasureKind } from 'convert';

import { formatBytesSize } from './i18n.js';

let _cpuThreadsCount: number | undefined = undefined;
export async function getCpuThreadsCount() {
	return (_cpuThreadsCount ??= navigator.hardwareConcurrency);
}

let _ramCapacityBytes: number | undefined | null = undefined;
export async function getRamCapacityBytes() {
	if (_ramCapacityBytes) return _ramCapacityBytes;

	if (Capacitor.isNativePlatform()) {
		const info = await CapacitorDeviceInfo.getInfo();

		if (info.totalMemory) return (_ramCapacityBytes = info.totalMemory);
	}

	// @ts-expect-error https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory
	const memory = navigator.deviceMemory as number;

	if (memory) return (_ramCapacityBytes = memory * 1e9);

	return null;
}

function satisfiedBy<K extends MeasureKind | string>(
	requirement: Requirement<K>,
	actualValue: number | null,
	actualUnit?: K extends MeasureKind ? UnitsByMeasure<K> : never
): boolean {
	if (!actualValue) return true;

	if (!actualUnit) return actualValue >= (requirement.limit ?? 0);

	return (
		convert(actualValue, actualUnit).to('best') >=
		convert(requirement.limit!, requirement.unit).to('best')
	);
}

async function* hardwareRequirementsFailures(requirements: typeof HardwareRequirements.infer) {
	const cpuThreads = await getCpuThreadsCount();
	const ramCapacityBytes = await getRamCapacityBytes();

	if (!satisfiedBy(requirements.cpu.threads, cpuThreads)) {
		yield `Le processeur a ${cpuThreads} threads (minimum de ${requirements.cpu.threads.limit} threads)`;
	}

	if (!satisfiedBy(requirements.ram.capacity, ramCapacityBytes, 'bytes')) {
		const requirementBytes = convert(
			requirements.ram.capacity.limit ?? 0,
			requirements.ram.capacity.unit
		).to('bytes');

		yield `L'appareil a ${formatBytesSize(ramCapacityBytes!)} de RAM (minimum de ${formatBytesSize(requirementBytes)} requis)`;
	}
}

export async function assertHardwareRequirements(requirements: typeof HardwareRequirements.infer) {
	const reasons = [] as string[];

	for await (const reason of hardwareRequirementsFailures(requirements)) {
		reasons.push(reason);
	}

	if (reasons.length > 0) {
		throw new Error(`Matériel incompatible: ${reasons.join(', ')}`);
	}
}

export async function satisfiesHardwareRequirements(
	requirements: undefined | typeof HardwareRequirements.infer
) {
	if (!requirements) return true;

	for await (const _ of hardwareRequirementsFailures(requirements)) {
		return false;
	}

	return true;
}
