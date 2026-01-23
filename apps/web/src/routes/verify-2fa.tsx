import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
	AlertCircleIcon as AlertCircle,
	CheckmarkCircle02Icon as CheckCircle2,
	SecurityCheckIcon as Shield,
} from "hugeicons-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/verify-2fa")({
	component: Verify2FAPage,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (session.data?.user) {
			// If already authenticated, redirect to dashboard
			throw redirect({ to: "/dashboard" });
		}
	},
});

function Verify2FAPage() {
	const navigate = useNavigate();
	const [code, setCode] = useState("");
	const [trustDevice, setTrustDevice] = useState(true);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [method, setMethod] = useState<"totp" | "otp" | "backup">("totp");

	const handleVerifyTOTP = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const { data, error: verifyError } =
				await authClient.twoFactor.verifyTotp({
					code,
					trustDevice,
				});

			if (verifyError) {
				setError(verifyError.message || "Invalid verification code");
				return;
			}

			if (data) {
				// Redirect to dashboard on successful verification
				navigate({ to: "/dashboard" });
			}
		} catch (_err) {
			setError("Failed to verify code. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyOTP = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const { data, error: verifyError } = await authClient.twoFactor.verifyOtp(
				{
					code,
					trustDevice,
				}
			);

			if (verifyError) {
				setError(verifyError.message || "Invalid verification code");
				return;
			}

			if (data) {
				navigate({ to: "/dashboard" });
			}
		} catch (_err) {
			setError("Failed to verify code. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyBackupCode = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const { data, error: verifyError } =
				await authClient.twoFactor.verifyBackupCode({
					code,
					trustDevice,
				});

			if (verifyError) {
				setError(verifyError.message || "Invalid backup code");
				return;
			}

			if (data) {
				navigate({ to: "/dashboard" });
			}
		} catch (_err) {
			setError("Failed to verify backup code. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleSendOTP = async () => {
		setError("");
		setLoading(true);

		try {
			const { error: sendError } = await authClient.twoFactor.sendOtp();

			if (sendError) {
				setError(sendError.message || "Failed to send OTP");
				return;
			}

			setMethod("otp");
		} catch (_err) {
			setError("Failed to send OTP. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
			<Card className="w-full max-w-md">
				<CardHeader>
					<div className="mb-4 flex items-center justify-center">
						<div className="rounded-full bg-primary/10 p-3">
							<Shield className="h-6 w-6 text-primary" />
						</div>
					</div>
					<CardTitle className="text-center">
						Two-Factor Authentication
					</CardTitle>
					<CardDescription className="text-center">
						{method === "totp" &&
							"Enter the 6-digit code from your authenticator app"}
						{method === "otp" && "Enter the code sent to your email"}
						{method === "backup" && "Enter one of your backup codes"}
					</CardDescription>
				</CardHeader>

				<form
					onSubmit={(e) => {
						if (method === "totp") {
							return handleVerifyTOTP(e);
						}
						if (method === "otp") {
							return handleVerifyOTP(e);
						}
						return handleVerifyBackupCode(e);
					}}
				>
					<CardContent className="space-y-4">
						{error && (
							<div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-destructive text-sm">
								<AlertCircle className="h-4 w-4 flex-shrink-0" />
								<span>{error}</span>
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="code">Verification Code</Label>
							<Input
								autoFocus
								className="text-center text-lg tracking-widest"
								id="code"
								maxLength={method === "backup" ? 8 : 6}
								onChange={(e) => setCode(e.target.value)}
								placeholder={
									method === "backup" ? "Enter backup code" : "000000"
								}
								required
								type="text"
								value={code}
							/>
						</div>

						<div className="flex items-center space-x-2">
							<input
								checked={trustDevice}
								className="h-4 w-4 rounded border-gray-300"
								id="trust-device"
								onChange={(e) => setTrustDevice(e.target.checked)}
								type="checkbox"
							/>
							<label
								className="text-gray-600 text-sm dark:text-gray-400"
								htmlFor="trust-device"
							>
								Trust this device for 30 days
							</label>
						</div>

						<div className="flex flex-col gap-2">
							{method !== "otp" && (
								<Button
									className="text-xs"
									disabled={loading}
									onClick={handleSendOTP}
									size="sm"
									type="button"
									variant="link"
								>
									Send code to email instead
								</Button>
							)}

							{method !== "backup" && (
								<Button
									className="text-xs"
									disabled={loading}
									onClick={() => setMethod("backup")}
									size="sm"
									type="button"
									variant="link"
								>
									Use backup code
								</Button>
							)}

							{method !== "totp" && (
								<Button
									className="text-xs"
									disabled={loading}
									onClick={() => setMethod("totp")}
									size="sm"
									type="button"
									variant="link"
								>
									Use authenticator app
								</Button>
							)}
						</div>
					</CardContent>

					<CardFooter>
						<Button className="w-full" disabled={loading} type="submit">
							{loading ? (
								"Verifying..."
							) : (
								<>
									<CheckCircle2 className="mr-2 h-4 w-4" />
									Verify
								</>
							)}
						</Button>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
