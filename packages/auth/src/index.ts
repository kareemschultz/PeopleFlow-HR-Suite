import { db } from "@PeopleFlow-HR-Suite/db";
// biome-ignore lint/performance/noNamespaceImport: drizzleAdapter requires the full schema object
import * as schema from "@PeopleFlow-HR-Suite/db/schema/auth";
import { env } from "@PeopleFlow-HR-Suite/env/server";
import { expo } from "@better-auth/expo";
import { checkout, polar, portal } from "@polar-sh/better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, twoFactor } from "better-auth/plugins";
import { sendInvitationEmail, sendOTPEmail } from "./lib/email";
import { polarClient } from "./lib/payments";

export const auth = betterAuth({
	appName: "PeopleFlow HR Suite",
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	trustedOrigins: [env.CORS_ORIGIN, "mybettertapp://", "exp://"],
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
			? {
					google: {
						clientId: env.GOOGLE_CLIENT_ID,
						clientSecret: env.GOOGLE_CLIENT_SECRET,
						accessType: "offline", // Always get refresh token
						prompt: "select_account consent", // Allow account selection
					},
				}
			: {}),
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: "none",
			secure: true,
			httpOnly: true,
		},
	},
	plugins: [
		// Two-Factor Authentication
		twoFactor({
			issuer: "PeopleFlow HR Suite",
			otpOptions: {
				async sendOTP({ user, otp }) {
					await sendOTPEmail({
						to: user.email,
						userName: user.name,
						otp,
					});
				},
				period: 5, // OTP valid for 5 minutes
			},
			totpOptions: {
				period: 30, // TOTP period in seconds
				digits: 6,
			},
			backupCodeOptions: {
				amount: 10, // Generate 10 backup codes
				length: 8, // 8 characters per code
			},
		}),

		// Organization Management
		organization({
			allowUserToCreateOrganization: true, // Can be restricted in future
			creatorRole: "owner",
			membershipLimit: 1000, // Max members per organization
			organizationLimit: 5, // Max organizations per user
			invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
			cancelPendingInvitationsOnReInvite: true,
			async sendInvitationEmail(data) {
				await sendInvitationEmail({
					email: data.email,
					inviterName: data.inviter.user.name,
					organizationName: data.organization.name,
					invitationId: data.id,
					role: data.role,
				});
			},
			organizationHooks: {
				// biome-ignore lint/suspicious/useAwait: Hook implementation may require async in future for database operations
				async afterCreateOrganization({ organization }) {
					console.log(`Organization created: ${organization.name}`);
					// Future: Create default resources, send welcome emails
				},
			},
		}),

		// Payment Processing
		polar({
			client: polarClient,
			createCustomerOnSignUp: true,
			enableCustomerPortal: true,
			use: [
				checkout({
					products: [
						{
							productId: "your-product-id",
							slug: "pro",
						},
					],
					successUrl: env.POLAR_SUCCESS_URL,
					authenticatedUsersOnly: true,
				}),
				portal(),
			],
		}),

		// Mobile Support
		expo(),
	],
});
