import { createContext } from "@PeopleFlow-HR-Suite/api/context";
import { appRouter } from "@PeopleFlow-HR-Suite/api/routers/index";
import { auth } from "@PeopleFlow-HR-Suite/auth";
import { env } from "@PeopleFlow-HR-Suite/env/server";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { type Context, Hono, type Next } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

// Performance middleware
app.use(logger());
app.use(compress()); // gzip/deflate compression for responses
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	})
);

app.on(["POST", "GET"], "/api/auth/*", (c: Context) => auth.handler(c.req.raw));

export const apiHandler = new OpenAPIHandler(appRouter, {
	plugins: [
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
	],
	interceptors: [
		onError((_error) => {
			// Errors are propagated to the client with appropriate status codes
			// Add logging service integration here if needed (e.g., Sentry)
		}),
	],
});

export const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [
		onError((_error) => {
			// Errors are propagated to the client with appropriate status codes
			// Add logging service integration here if needed (e.g., Sentry)
		}),
	],
});

app.use("/*", async (c: Context, next: Next) => {
	const context = await createContext({ context: c });

	const rpcResult = await rpcHandler.handle(c.req.raw, {
		prefix: "/rpc",
		context,
	});

	if (rpcResult.matched) {
		return c.newResponse(rpcResult.response.body, rpcResult.response);
	}

	const apiResult = await apiHandler.handle(c.req.raw, {
		prefix: "/api-reference",
		context,
	});

	if (apiResult.matched) {
		return c.newResponse(apiResult.response.body, apiResult.response);
	}

	await next();
});

app.get("/", (c: Context) => {
	return c.text("OK");
});

export default app;
