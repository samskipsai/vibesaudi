/**
 * Stub replacement for mime-types package in Cloudflare Workers
 * Workers don't support Node.js require(), so we provide a minimal compatible interface
 */

export function lookup(path: string): string | false {
	// Basic MIME type lookup based on file extension
	const ext = path.split('.').pop()?.toLowerCase() || '';
	
	const mimeTypes: Record<string, string> = {
		// Text
		html: 'text/html',
		htm: 'text/html',
		css: 'text/css',
		js: 'application/javascript',
		mjs: 'application/javascript',
		json: 'application/json',
		xml: 'application/xml',
		txt: 'text/plain',
		
		// Images
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		gif: 'image/gif',
		svg: 'image/svg+xml',
		webp: 'image/webp',
		ico: 'image/x-icon',
		
		// Fonts
		woff: 'font/woff',
		woff2: 'font/woff2',
		ttf: 'font/ttf',
		otf: 'font/otf',
	};
	
	return mimeTypes[ext] || false;
}

export function contentType(path: string): string | false {
	return lookup(path);
}

export default { lookup, contentType };

