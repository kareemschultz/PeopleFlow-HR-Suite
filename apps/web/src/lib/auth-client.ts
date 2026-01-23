import { env } from "@PeopleFlow-HR-Suite/env/web";
import { polarClient } from "@polar-sh/better-auth";
import {
	organizationClient,
	twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: env.VITE_SERVER_URL,
	plugins: [
		// Payment processing
		polarClient(),

		// Two-Factor Authentication
		twoFactorClient({
			onTwoFactorRedirect() {
				// Redirect to 2FA verification page
				window.location.href = "/verify-2fa";
			},
		}),

		// Organization Management
		organizationClient(),
	],
});
