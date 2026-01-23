/**
 * Email utilities for Better Auth
 * Handles OTP and invitation emails
 */

import { env } from "@PeopleFlow-HR-Suite/env/server";

interface SendOTPEmailParams {
	to: string;
	userName: string;
	otp: string;
}

interface SendInvitationEmailParams {
	email: string;
	inviterName: string;
	organizationName: string;
	invitationId: string;
	role: string;
}

/**
 * Send OTP email for two-factor authentication
 * TODO: Replace with your email service (Resend, SendGrid, etc.)
 */
// biome-ignore lint/suspicious/useAwait: Email service integration will add await in production
export async function sendOTPEmail({
	to,
	userName,
	otp,
}: SendOTPEmailParams): Promise<void> {
	// In development, just log to console
	if (env.NODE_ENV === "development") {
		console.log(`
═══════════════════════════════════════════
📧 OTP Email (Development Mode)
═══════════════════════════════════════════
To: ${to}
User: ${userName}
OTP Code: ${otp}
Valid for: 5 minutes
═══════════════════════════════════════════
		`);
		return;
	}

	// TODO: Production email implementation
	// Example with Resend:
	// await resend.emails.send({
	//   from: 'noreply@peopleflow.com',
	//   to,
	//   subject: 'Your Two-Factor Authentication Code',
	//   html: `
	//     <h1>Hi ${userName},</h1>
	//     <p>Your OTP code is: <strong>${otp}</strong></p>
	//     <p>This code will expire in 5 minutes.</p>
	//   `
	// });

	console.warn(
		"Production email not configured. OTP:",
		otp,
		"for user:",
		userName
	);
}

/**
 * Send organization invitation email
 * TODO: Replace with your email service
 */
// biome-ignore lint/suspicious/useAwait: Email service integration will add await in production
export async function sendInvitationEmail({
	email,
	inviterName,
	organizationName,
	invitationId,
	role,
}: SendInvitationEmailParams): Promise<void> {
	const inviteLink = `${env.CORS_ORIGIN}/accept-invitation/${invitationId}`;

	// In development, just log to console
	if (env.NODE_ENV === "development") {
		console.log(`
═══════════════════════════════════════════
📧 Invitation Email (Development Mode)
═══════════════════════════════════════════
To: ${email}
Invited by: ${inviterName}
Organization: ${organizationName}
Role: ${role}
Invitation Link: ${inviteLink}
═══════════════════════════════════════════
		`);
		return;
	}

	// TODO: Production email implementation
	// await resend.emails.send({
	//   from: 'noreply@peopleflow.com',
	//   to: email,
	//   subject: `You've been invited to join ${organizationName}`,
	//   html: `
	//     <h1>You've been invited!</h1>
	//     <p>${inviterName} has invited you to join ${organizationName} as a ${role}.</p>
	//     <a href="${inviteLink}">Accept Invitation</a>
	//   `
	// });

	console.warn(
		"Production email not configured. Invitation for:",
		email,
		"Link:",
		inviteLink
	);
}
