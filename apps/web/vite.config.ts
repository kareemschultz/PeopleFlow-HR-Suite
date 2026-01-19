import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
// TanStack Router plugin is incompatible with Zod v4 (expects v3.24.2)
// import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		tailwindcss(),
		// Disabled: @tanstack/router-plugin requires zod v3, but project uses zod v4
		// Zod v4 has breaking changes (.returns() removed) that break the plugin
		// TODO: Re-enable when plugin adds zod v4 support
		// tanstackRouter({}),
		react(),
		VitePWA({
			registerType: "autoUpdate",
			manifest: {
				name: "PeopleFlow-HR-Suite",
				short_name: "PeopleFlow-HR-Suite",
				description: "PeopleFlow-HR-Suite - PWA Application",
				theme_color: "#0c0c0c",
			},
			pwaAssets: { disabled: false, config: true },
			devOptions: { enabled: true },
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		port: 3001,
	},
});
