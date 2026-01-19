import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		tailwindcss(),
		// Temporarily disabled due to zod ESM import issue in plugin's nested dependencies
		// TODO: Re-enable when @tanstack/router-plugin fixes the nested zod dependency issue
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
