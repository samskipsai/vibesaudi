// Cloudflare Workers runtime types are available globally
// These declarations ensure TypeScript recognizes them

// RateLimit is a Cloudflare Workers binding type
// It's available through the Env interface but we need to declare it as a global type
declare global {
	interface RateLimit {
		limit(options: { key: string }): Promise<{ success: boolean }>;
	}
	
	// Request, TextEncoder, TextDecoder, and crypto are available in Workers runtime
	// These are part of the WebWorker lib but TypeScript needs explicit recognition
	// They are already available in the Workers runtime, this is just for TypeScript
}

export {};

