import { createHash, timingSafeEqual } from 'node:crypto';

import config from './config.js';

function passwordHash(pw: string) {
	return createHash('sha256').update(pw).digest();
}

export function isAuthorized(req: Request): boolean {
	if (!config.API_PASSWORD) return false;
	const expected = passwordHash(config.API_PASSWORD);
	const header = req.headers.get('authorization') ?? '';
	if (header.startsWith('Bearer ')) {
		const actual = passwordHash(header.slice('Bearer '.length));
		if (actual.length === expected.length && timingSafeEqual(actual, expected)) return true;
	}
	const cookieHeader = req.headers.get('cookie') ?? '';
	for (const part of cookieHeader.split(';')) {
		const eq = part.indexOf('=');
		if (eq === -1) continue;
		if (part.slice(0, eq).trim() !== config.AUTH_COOKIE) continue;
		const actual = Buffer.from(decodeURIComponent(part.slice(eq + 1)), 'hex');
		return actual.length === expected.length && timingSafeEqual(actual, expected);
	}
	return false;
}

export function unauthorized(): Response {
	if (!config.API_PASSWORD) {
		return Response.json(
			{ error: 'API_PASSWORD env var is not set; protected routes are disabled' },
			{ status: 503 }
		);
	}
	return new Response(
		`<html><body>Unauthorized. <a href="/api/login">Log in</a> (password required).</body></html>`,
		{
			status: 401,
			headers: { 'WWW-Authenticate': 'Bearer', 'Content-Type': 'text/html; charset=utf-8' },
		}
	);
}

// Login for browsers: verifies the password and sets an HttpOnly
// cookie (holding its sha256, not the password itself).
export function handleLogin(password: string): Response {
	const expected = passwordHash(config.API_PASSWORD ?? '');
	const actual = passwordHash(password);
	if (
		config.API_PASSWORD &&
		actual.length === expected.length &&
		timingSafeEqual(actual, expected)
	) {
		const cookie = `${config.AUTH_COOKIE}=${expected.toString('hex')}; Path=/; HttpOnly; SameSite=Lax`;
		return new Response('Logged in', {
			headers: { 'Set-Cookie': cookie, 'Content-Type': 'text/plain' },
		});
	}
	return new Response('Invalid password', {
		status: 401,
		headers: { 'Content-Type': 'text/plain' },
	});
}
