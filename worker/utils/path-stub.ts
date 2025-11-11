/**
 * Stub replacement for Node.js path module in Cloudflare Workers
 * Provides minimal path utilities compatible with Workers runtime
 */

export function basename(path: string, ext?: string): string {
	const name = path.split('/').pop() || path;
	if (ext && name.endsWith(ext)) {
		return name.slice(0, -ext.length);
	}
	return name;
}

export function dirname(path: string): string {
	const parts = path.split('/');
	parts.pop();
	return parts.join('/') || '.';
}

export function extname(path: string): string {
	const parts = path.split('.');
	if (parts.length > 1) {
		return '.' + parts.pop();
	}
	return '';
}

export function join(...paths: string[]): string {
	return paths.filter(Boolean).join('/').replace(/\/+/g, '/');
}

export function resolve(...paths: string[]): string {
	return join(...paths);
}

export default {
	basename,
	dirname,
	extname,
	join,
	resolve,
};

