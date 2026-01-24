import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "happy-dom",
		setupFiles: ["./vitest.setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/**",
				"dist/**",
				"**/*.config.ts",
				"**/*.config.js",
				"**/routeTree.gen.ts",
				"**/*.d.ts",
			],
		},
		include: ["**/*.{test,spec}.{js,ts,jsx,tsx}"],
		exclude: ["node_modules", "dist", ".next", ".turbo"],
	},
});
