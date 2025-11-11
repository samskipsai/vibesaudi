// import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
// import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vite.dev/config/
export default defineConfig({
	optimizeDeps: {
		exclude: ['format', 'editor.all'],
		include: ['monaco-editor/esm/vs/editor/editor.api'],
		force: true, // Force re-optimization on every start
		// Note: esbuildOptions is deprecated, use build.rollupOptions for chunk splitting instead
	},
	plugins: [
		react(),
		svgr(),
		cloudflare({
			configPath: 'wrangler.jsonc',
			experimental: { remoteBindings: true },
		}), // Add the node polyfills plugin here
		// nodePolyfills({
		//     exclude: [
		//       'tty', // Exclude 'tty' module
		//     ],
		//     // We recommend leaving this as `true` to polyfill `global`.
		//     globals: {
		//         global: true,
		//     },
		// })
		tailwindcss(),
		// sentryVitePlugin({
		// 	org: 'cloudflare-0u',
		// 	project: 'javascript-react',
		// }),
	],

	resolve: {
		alias: {
			// 'path': 'path-browserify',
			// Add this line to fix the 'debug' package issue
			debug: 'debug/src/browser',
			// Replace Node.js-specific packages with Workers-compatible stubs
			'mime-types': path.resolve(__dirname, './worker/utils/mime-types-stub.ts'),
			'path': path.resolve(__dirname, './worker/utils/path-stub.ts'),
			// "@": path.resolve(__dirname, "./src"),
			'@': path.resolve(__dirname, './src'),
            'shared': path.resolve(__dirname, './shared'),
            'worker': path.resolve(__dirname, './worker'),
		},
	},

	// Configure for Prisma + Cloudflare Workers compatibility
	define: {
		// Ensure proper module definitions for Cloudflare Workers context
		'process.env.NODE_ENV': JSON.stringify(
			process.env.NODE_ENV || 'development',
		),
		global: 'globalThis',
		// '__filename': '""',
		// '__dirname': '""',
	},

	worker: {
		// Handle Prisma in worker context for development
		format: 'es',
	},

	server: {
		allowedHosts: true,
		hmr: {
			// Force HMR WebSocket to connect to localhost even when accessed via custom domain
			host: 'localhost',
			port: 8001,
			clientPort: 8001,
			protocol: 'ws',
		},
	},

	// Clear cache more aggressively
	cacheDir: 'node_modules/.vite',

	build: {
		sourcemap: true,
		chunkSizeWarningLimit: 1000, // Warn for chunks larger than 1MB
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					// Separate Monaco Editor into its own chunk
					if (id.includes('monaco-editor')) {
						return 'monaco-editor';
					}
					// Separate large UI libraries
					if (id.includes('framer-motion')) {
						return 'framer-motion';
					}
					// Separate React and React DOM
					if (id.includes('react-dom')) {
						return 'react-dom';
					}
					if (id.includes('react') && !id.includes('react-dom')) {
						return 'react';
					}
					// Vendor chunk for other node_modules
					if (id.includes('node_modules')) {
						return 'vendor';
					}
				},
			},
		},
	},
});
