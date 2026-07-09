<script lang="ts">
	// @wc-ignore-file

	import * as dates from 'date-fns';
	import { renderSVG } from 'uqr';

	/**
	 * @see https://github.com/zxing/zxing/wiki/Barcode-Contents#wi-fi-network-config-android-ios-11
	 */
	type WifiQRData = {
		kind: 'wifi';
		ssid: string;
		type: 'WEP' | 'WPA' | 'nopass';
		password: string;
	};

	/**
	 * @see https://github.com/zxing/zxing/wiki/Barcode-Contents#maps-geographic-information
	 */
	type GeographicQRData = {
		kind: 'geo';
		latitude: number;
		longitude: number;
		altitude: number;
	};

	/**
	 * @see https://github.com/zxing/zxing/wiki/Barcode-Contents#calendar-events
	 */
	type CalendarEventQRData = {
		kind: 'calendar';
		summary: string;
		start: Date;
		end: Date;
	};

	type RawQRData = {
		kind: 'raw';
		contents: Uint8Array;
	};

	type TextQRData = {
		kind: 'text';
		text: string;
	};

	type URLQRData = {
		kind: 'url';
		url: URL | string;
	};

	/**
	 * @see https://github.com/zxing/zxing/wiki/Barcode-Contents
	 */
	type QRData =
		URLQRData | TextQRData | RawQRData | WifiQRData | GeographicQRData | CalendarEventQRData;

	type Props = QRData;

	const data: Props = $props();

	const qrdata = $derived.by(() => {
		switch (data.kind) {
			case 'raw':
				return Array.from(data.contents);
			case 'text':
				return data.text;
			case 'url':
				return data.url.toString();
			case 'calendar':
				return [
					'BEGIN:VEVENT',
					`SUMMARY:${data.summary.replaceAll(/\s/g, '+')}`,
					`DTSTART:${dates.format(data.start, "YYYYMMdd'T'HHmmssX")}`,
					`DTEND:${dates.format(data.end, "YYYYMMdd'T'HHmmssX")}`,
					'END:VEVENT',
				].join('\n');
			case 'wifi':
				return [
					`WIFI:T:${data.type}`,
					`S:${JSON.stringify(data.ssid)}`,
					`P:${JSON.stringify(data.password || '_')}`,
					'',
				].join(';');
			case 'geo':
				return `geo:${data.latitude},${data.longitude},${data.altitude}`;
		}
	});
</script>

<div class="qrcode">{@html renderSVG(qrdata)}</div>

<style>
	.qrcode {
		display: contents;
	}

	.qrcode :global(svg) {
		height: 100%;
		width: 100%;
		min-height: 50px;
		min-width: 50px;
		object-fit: contain;
	}
</style>
