import { createLogger } from './logger';
import { SmartCodeGeneratorAgent } from './agents/core/smartGeneratorAgent';
import { proxyToSandbox } from '@cloudflare/sandbox';
import { isDispatcherAvailable } from './utils/dispatcherUtils';
import { createApp } from './app';
// import * as Sentry from '@sentry/cloudflare';
// import { sentryOptions } from './observability/sentry';
import { DORateLimitStore as BaseDORateLimitStore } from './services/rate-limit/DORateLimitStore';
import { getPreviewDomain } from './utils/urls';
import { proxyToAiGateway } from './services/aigateway-proxy/controller';
import { isOriginAllowed } from './config/security';

// Durable Object and Service exports
export { UserAppSandboxService, DeployerService } from './services/sandbox/sandboxSdkClient';

// export const CodeGeneratorAgent = Sentry.instrumentDurableObjectWithSentry(sentryOptions, SmartCodeGeneratorAgent);
// export const DORateLimitStore = Sentry.instrumentDurableObjectWithSentry(sentryOptions, BaseDORateLimitStore);
export const CodeGeneratorAgent = SmartCodeGeneratorAgent;
export const DORateLimitStore = BaseDORateLimitStore;

// Logger for the main application and handlers
const logger = createLogger('App');

function setOriginControl(env: Env, request: Request, currentHeaders: Headers): Headers {
    const origin = request.headers.get('Origin');
    
    if (origin && isOriginAllowed(env, origin)) {
        currentHeaders.set('Access-Control-Allow-Origin', origin);
    }
    return currentHeaders;
}

/**
 * Handles requests for user-deployed applications on subdomains.
 * It first attempts to proxy to a live development sandbox. If that fails,
 * it dispatches the request to a permanently deployed worker via namespaces.
 * This function will NOT fall back to the main worker.
 *
 * @param request The incoming Request object.
 * @param env The environment bindings.
 * @returns A Response object from the sandbox, the dispatched worker, or an error.
 */
async function handleUserAppRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const { hostname } = url;
	logger.info(`Handling user app request for: ${hostname}`);

	// IMPORTANT: Check for WebSocket upgrade requests FIRST
	// WebSocket requests cannot be serialized across Durable Object RPC boundaries
	// See: https://github.com/cloudflare/workerd/issues/2319
	const upgradeHeader = request.headers.get('Upgrade');
	if (upgradeHeader?.toLowerCase() === 'websocket') {
		logger.info(`WebSocket upgrade request detected for ${hostname} - WebSockets are not supported in sandbox preview mode`);
		
		// Return a 400 Bad Request for WebSocket upgrade attempts in preview
		// User apps that use WebSockets will need to be deployed to work properly
		return new Response('WebSocket connections are not supported in sandbox preview mode. Please deploy your application to use WebSocket features.', {
			status: 400,
			statusText: 'WebSocket Not Supported in Preview',
			headers: {
				'Content-Type': 'text/plain',
				'X-Preview-Type': 'websocket-not-supported',
				'X-Deployment-Required': 'true'
			}
		});
	}

	// 1. Attempt to proxy to a live development sandbox.
	// proxyToSandbox doesn't consume the request body on a miss, so no clone is needed here.
	let sandboxResponse: Response | null = null;
	try {
		sandboxResponse = await proxyToSandbox(request, env);
	} catch (error: any) {
		// Catch any unexpected errors during proxying
		const errorMessage = error?.message || String(error);
		logger.error(`Error proxying to sandbox for ${hostname}: ${errorMessage}`, error);
		
		// If it's still a WebSocket serialization error (shouldn't happen now), handle gracefully
		if (errorMessage.includes('WebSocket') || errorMessage.includes('serialize')) {
			logger.warn(`WebSocket serialization error leaked through - this shouldn't happen`);
			return new Response('Preview temporarily unavailable due to WebSocket connection issue. Please deploy your application.', {
				status: 503,
				headers: {
					'Content-Type': 'text/plain',
					'X-Preview-Type': 'sandbox-error',
					'Retry-After': '5',
					'X-Deployment-Required': 'true'
				}
			});
		}
		
		// For other errors, continue to dispatcher fallback
		sandboxResponse = null;
	}
	
	if (sandboxResponse) {
		logger.info(`Serving response from sandbox for: ${hostname}`);
		
		// Add headers to identify this as a sandbox response
		let headers = new Headers(sandboxResponse.headers);
		
        if (sandboxResponse.status === 500) {
            headers.set('X-Preview-Type', 'sandbox-error');
        } else {
            headers.set('X-Preview-Type', 'sandbox');
        }
        headers = setOriginControl(env, request, headers);
        headers.append('Vary', 'Origin');
		headers.set('Access-Control-Expose-Headers', 'X-Preview-Type');
		
		return new Response(sandboxResponse.body, {
			status: sandboxResponse.status,
			statusText: sandboxResponse.statusText,
			headers,
		});
	}

	// 2. If sandbox misses, attempt to dispatch to a deployed worker.
	logger.info(`Sandbox miss for ${hostname}, attempting dispatch to permanent worker.`);
	if (!isDispatcherAvailable(env)) {
		logger.warn(`Dispatcher not available, cannot serve: ${hostname}`);
		return new Response('This application is not currently available.', { status: 404 });
	}

	// Extract the app name (e.g., "xyz" from "xyz.build.cloudflare.dev").
	const appName = hostname.split('.')[0];
	const dispatcher = env['DISPATCHER'];

	try {
		const worker = dispatcher.get(appName);
		const dispatcherResponse = await worker.fetch(request);
		
		// Add headers to identify this as a dispatcher response
		let headers = new Headers(dispatcherResponse.headers);
		
		headers.set('X-Preview-Type', 'dispatcher');
        headers = setOriginControl(env, request, headers);
        headers.append('Vary', 'Origin');
		headers.set('Access-Control-Expose-Headers', 'X-Preview-Type');
		
		return new Response(dispatcherResponse.body, {
			status: dispatcherResponse.status,
			statusText: dispatcherResponse.statusText,
			headers,
		});
	} catch (error: any) {
		// This block catches errors if the binding doesn't exist or if worker.fetch() fails.
		const errorMessage = error?.message || String(error);
		const isWorkerNotFound = errorMessage.includes('not found') || 
		                         errorMessage.includes('Worker not found') ||
		                         errorMessage.includes('does not exist');
		
		if (isWorkerNotFound) {
			logger.warn(`Worker '${appName}' not found in dispatch namespace`);
			return new Response('This application is not currently available.', { status: 404 });
		}
		
		logger.error(`Error dispatching to worker '${appName}': ${errorMessage}`, { 
			hostname,
			appName,
			error: errorMessage 
		});
		return new Response('An error occurred while loading this application.', { status: 500 });
	}
}

/**
 * Main Worker fetch handler with robust, secure routing.
 */
const worker = {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        logger.info(`Received request: ${request.method} ${request.url}`);
		// --- Pre-flight Checks ---

		// 1. Critical configuration check: Ensure custom domain is set.
        const previewDomain = getPreviewDomain(env);
		if (!previewDomain || previewDomain.trim() === '') {
			logger.error('FATAL: env.CUSTOM_DOMAIN is not configured in wrangler.toml or the Cloudflare dashboard.');
			return new Response('Server configuration error: Application domain is not set.', { status: 500 });
		}

		const url = new URL(request.url);
		const { hostname, pathname } = url;

		// 2. Security: Immediately reject any requests made via an IP address.
		const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
		if (ipRegex.test(hostname)) {
			return new Response('Access denied. Please use the assigned domain name.', { status: 403 });
		}

		// --- Domain-based Routing ---

		// Normalize hostnames for both local development (localhost) and production.
		const isMainDomainRequest =
			hostname === env.CUSTOM_DOMAIN || hostname === 'localhost';
		const isSubdomainRequest =
			hostname.endsWith(`.${previewDomain}`) ||
			(hostname.endsWith('.localhost') && hostname !== 'localhost');

		// Route 1: Main Platform Request (e.g., build.cloudflare.dev or localhost)
		if (isMainDomainRequest) {
			// Serve static assets for all non-API routes from the ASSETS binding.
			if (!pathname.startsWith('/api/')) {
				return env.ASSETS.fetch(request);
			}
			// AI Gateway proxy for generated apps
			if (pathname.startsWith('/api/proxy/openai')) {
                // Only handle requests from valid origins of the preview domain
                const origin = request.headers.get('Origin');
                const previewDomain = getPreviewDomain(env);

                logger.info(`Origin: ${origin}, Preview Domain: ${previewDomain}`);
                
                return proxyToAiGateway(request, env, ctx);
				// if (origin && origin.endsWith(`.${previewDomain}`)) {
                //     return proxyToAiGateway(request, env, ctx);
                // }
                // logger.warn(`Access denied. Invalid origin: ${origin}, preview domain: ${previewDomain}`);
                // return new Response('Access denied. Invalid origin.', { status: 403 });
			}
			// Handle all API requests with the main Hono application.
			logger.info(`Handling API request for: ${url}`);
			const app = createApp(env);
			return app.fetch(request, env, ctx);
		}

		// Route 2: User App Request (e.g., xyz.build.cloudflare.dev or test.localhost)
		if (isSubdomainRequest) {
			return handleUserAppRequest(request, env);
		}

		return new Response('Not Found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;

export default worker;

// Wrap the entire worker with Sentry for comprehensive error monitoring.
// export default Sentry.withSentry(sentryOptions, worker);
