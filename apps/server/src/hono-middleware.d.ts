// Type declarations for Hono middleware modules with empty .d.ts files
declare module "hono/cors" {
	import type { MiddlewareHandler } from "hono";

	interface CORSOptions {
		origin?: string | string[] | ((origin: string) => string | null);
		allowMethods?: string[];
		allowHeaders?: string[];
		maxAge?: number;
		credentials?: boolean;
		exposeHeaders?: string[];
	}

	export default function cors(options?: CORSOptions): MiddlewareHandler;
}

declare module "hono/logger" {
	import type { MiddlewareHandler } from "hono";

	export default function logger(): MiddlewareHandler;
}
