import { json } from '@sveltejs/kit';
import { initializeDatabase } from '$lib/server/db.js';

initializeDatabase();

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Reject non-loopback Host headers so a misbound/public adapter cannot expose the ledger.
 */
function isLoopbackHost(hostHeader) {
	const host = String(hostHeader || '')
		.trim()
		.toLowerCase()
		.split(':')[0];
	return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1';
}

/**
 * Block cross-site browser mutations and non-JSON write bodies (SEC-001 / SEC-002).
 */
export async function handle({ event, resolve }) {
	const host = event.request.headers.get('host');
	if (!isLoopbackHost(host)) {
		return json({ error: 'this application only accepts localhost requests' }, { status: 403 });
	}

	if (MUTATING.has(event.request.method) && event.url.pathname.startsWith('/api/')) {
		const site = String(event.request.headers.get('sec-fetch-site') || '')
			.trim()
			.toLowerCase();
		if (site === 'cross-site') {
			return json({ error: 'cross-site mutations are not allowed' }, { status: 403 });
		}

		const origin = String(event.request.headers.get('origin') || '').trim();
		if (origin) {
			try {
				const originHost = new URL(origin).hostname.toLowerCase();
				if (originHost !== 'localhost' && originHost !== '127.0.0.1' && originHost !== '::1') {
					return json({ error: 'cross-origin mutations are not allowed' }, { status: 403 });
				}
			} catch {
				return json({ error: 'invalid origin' }, { status: 403 });
			}
		}

		if (event.request.method !== 'DELETE') {
			const contentType = String(event.request.headers.get('content-type') || '')
				.trim()
				.toLowerCase();
			if (!contentType.startsWith('application/json')) {
				return json({ error: 'content-type must be application/json' }, { status: 415 });
			}
		}
	}

	return resolve(event);
}
