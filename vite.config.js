import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// Local-finance invariant: never bind the Vite/dev server beyond loopback (SEC-002).
	server: {
		host: '127.0.0.1',
		strictPort: false
	},
	preview: {
		host: '127.0.0.1'
	}
});
