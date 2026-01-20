import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	clientPrefix: "VITE_",
	client: {
		VITE_SERVER_URL: z.url(),
	},
	// @ts-expect-error - import.meta.env is not typed in this context yet
	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true,
});
