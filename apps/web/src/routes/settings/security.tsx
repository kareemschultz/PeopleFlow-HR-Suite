import { createFileRoute } from "@tanstack/react-router";
import {
	AlertCircleIcon as AlertCircle,
	CheckmarkCircle02Icon as CheckCircle2,
	Copy01Icon as Copy,
	QrCode01Icon as QrCode01,
	SecurityCheckIcon as Shield,
} from "hugeicons-react";
import { useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { authClient } from "../../lib/auth-client";

export const Route = createFileRoute("/settings/security")({
	component: SecuritySettingsPage,
});

function SecuritySettingsPage() {
	const [password, setPassword] = useState("");
	const [totpCode, setTotpCode] = useState("");
	const [totpURI, setTotpURI] = useState("");
	const [backupCodes, setBackupCodes] = useState<string[]>([]);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);
	const [showQR, setShowQR] = useState(false);

	const { data: session } = authClient.useSession();
	const twoFactorEnabled = session?.user?.twoFactorEnabled ?? false;

	const handleEnable2FA = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		setLoading(true);

		try {
			const { data, error: enableError } = await authClient.twoFactor.enable({
				password,
			});

			if (enableError) {
				setError(enableError.message || "Failed to enable 2FA");
				return;
			}

			if (data) {
				setTotpURI(data.totpURI);
				setBackupCodes(data.backupCodes);
				setShowQR(true);
				setSuccess(
					"2FA enabled successfully! Please save your backup codes and scan the QR code with your authenticator app."
				);
			}
		} catch (_err) {
			setError("Failed to enable 2FA. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleDisable2FA = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		setLoading(true);

		try {
			const { error: disableError } = await authClient.twoFactor.disable({
				password,
			});

			if (disableError) {
				setError(disableError.message || "Failed to disable 2FA");
				return;
			}

			setSuccess("2FA disabled successfully");
			setPassword("");
			setTotpURI("");
			setBackupCodes([]);
			setShowQR(false);
		} catch (_err) {
			setError("Failed to disable 2FA. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyTOTP = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		setLoading(true);

		try {
			const { error: verifyError } = await authClient.twoFactor.verifyTotp({
				code: totpCode,
			});

			if (verifyError) {
				setError(verifyError.message || "Invalid verification code");
				return;
			}

			setSuccess("2FA verified successfully!");
			setShowQR(false);
			setTotpCode("");
		} catch (_err) {
			setError("Failed to verify code. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleRegenerateBackupCodes = async () => {
		setError("");
		setSuccess("");
		setLoading(true);

		try {
			const { data, error: genError } =
				await authClient.twoFactor.generateBackupCodes({
					password,
				});

			if (genError) {
				setError(genError.message || "Failed to generate backup codes");
				return;
			}

			if (data) {
				setBackupCodes(data.backupCodes);
				setSuccess("Backup codes regenerated successfully!");
			}
		} catch (_err) {
			setError("Failed to generate backup codes. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		setSuccess("Copied to clipboard!");
		setTimeout(() => setSuccess(""), 2000);
	};

	return (
		<div className="container max-w-4xl space-y-6 py-8">
			<div>
				<h1 className="font-bold text-3xl">Security Settings</h1>
				<p className="mt-2 text-muted-foreground">
					Manage your account security and two-factor authentication
				</p>
			</div>

			{error && (
				<div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-destructive text-sm">
					<AlertCircle className="h-4 w-4 flex-shrink-0" />
					<span>{error}</span>
				</div>
			)}

			{success && (
				<div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-green-600 text-sm dark:bg-green-950">
					<CheckCircle2 className="h-4 w-4 flex-shrink-0" />
					<span>{success}</span>
				</div>
			)}

			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Shield className="h-5 w-5 text-primary" />
						<CardTitle>Two-Factor Authentication</CardTitle>
					</div>
					<CardDescription>
						Add an extra layer of security to your account by requiring a
						verification code in addition to your password.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex items-center justify-between rounded-lg border p-4">
						<div>
							<p className="font-medium">Status</p>
							<p className="text-muted-foreground text-sm">
								{twoFactorEnabled ? "Enabled" : "Disabled"}
							</p>
						</div>
						<div
							className={`rounded-full px-3 py-1 font-medium text-xs ${
								twoFactorEnabled
									? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
									: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
							}`}
						>
							{twoFactorEnabled ? "Active" : "Inactive"}
						</div>
					</div>

					{twoFactorEnabled ? (
						<form className="space-y-4" onSubmit={handleDisable2FA}>
							<div className="space-y-2">
								<Label htmlFor="disable-password">Confirm Password</Label>
								<Input
									id="disable-password"
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Enter your password"
									required
									type="password"
									value={password}
								/>
							</div>

							<div className="flex gap-2">
								<Button disabled={loading} type="submit" variant="destructive">
									{loading ? "Disabling..." : "Disable 2FA"}
								</Button>
								<Button
									disabled={loading}
									onClick={handleRegenerateBackupCodes}
									type="button"
									variant="outline"
								>
									Regenerate Backup Codes
								</Button>
							</div>
						</form>
					) : (
						<form className="space-y-4" onSubmit={handleEnable2FA}>
							<div className="space-y-2">
								<Label htmlFor="password">Confirm Password</Label>
								<Input
									id="password"
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Enter your password"
									required
									type="password"
									value={password}
								/>
							</div>

							<Button disabled={loading} type="submit">
								{loading ? "Enabling..." : "Enable 2FA"}
							</Button>
						</form>
					)}

					{showQR && totpURI && (
						<div className="space-y-4">
							<div className="rounded-lg border p-4">
								<div className="mb-4 flex items-center gap-2">
									<QrCode01 className="h-5 w-5 text-primary" />
									<h3 className="font-medium">Scan QR Code</h3>
								</div>
								<div className="flex justify-center bg-white p-4">
									<QRCode size={200} value={totpURI} />
								</div>
								<p className="mt-4 text-center text-muted-foreground text-xs">
									Scan this QR code with your authenticator app (Google
									Authenticator, Authy, etc.)
								</p>
							</div>

							<form className="space-y-4" onSubmit={handleVerifyTOTP}>
								<div className="space-y-2">
									<Label htmlFor="totp-code">Verify Code</Label>
									<Input
										className="text-center text-lg tracking-widest"
										id="totp-code"
										maxLength={6}
										onChange={(e) => setTotpCode(e.target.value)}
										placeholder="000000"
										required
										type="text"
										value={totpCode}
									/>
									<p className="text-muted-foreground text-xs">
										Enter the 6-digit code from your authenticator app to
										complete setup
									</p>
								</div>

								<Button disabled={loading} type="submit">
									{loading ? "Verifying..." : "Verify & Complete Setup"}
								</Button>
							</form>
						</div>
					)}

					{backupCodes.length > 0 && (
						<div className="rounded-lg border p-4">
							<div className="mb-4 flex items-center justify-between">
								<h3 className="font-medium">Backup Codes</h3>
								<Button
									onClick={() => copyToClipboard(backupCodes.join("\n"))}
									size="sm"
									variant="outline"
								>
									<Copy className="mr-2 h-4 w-4" />
									Copy All
								</Button>
							</div>
							<div className="grid grid-cols-2 gap-2">
								{backupCodes.map((code) => (
									<button
										className="cursor-pointer rounded bg-muted p-2 text-left font-mono text-sm hover:bg-muted/80"
										key={code}
										onClick={() => copyToClipboard(code)}
										type="button"
									>
										{code}
									</button>
								))}
							</div>
							<p className="mt-4 text-muted-foreground text-xs">
								Save these backup codes in a safe place. Each code can only be
								used once if you lose access to your authenticator app.
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
