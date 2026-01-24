import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { GoogleIcon } from "hugeicons-react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import Loader from "./loader";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";

export default function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const navigate = useNavigate({
		from: "/",
	});
	const { isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onSuccess: (context) => {
						// Check if 2FA verification is required
						if (
							context.data &&
							"twoFactorRedirect" in context.data &&
							context.data.twoFactorRedirect
						) {
							navigate({ to: "/verify-2fa" });
							toast.info("Please verify your two-factor authentication code");
						} else {
							navigate({ to: "/dashboard" });
							toast.success("Sign in successful");
						}
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				}
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	const handleGoogleSignIn = async () => {
		try {
			await authClient.signIn.social({
				provider: "google",
				callbackURL: "/dashboard",
			});
		} catch (_error) {
			toast.error("Failed to sign in with Google");
		}
	};

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950">
			<div className="w-full max-w-md space-y-8 rounded-2xl border-2 bg-background p-8 shadow-xl">
				{/* Logo & Branding */}
				<div className="text-center">
					<h2 className="font-bold text-3xl">
						<span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-cyan-400 dark:to-blue-400">
							PeopleFlow
						</span>
					</h2>
					<p className="mt-2 text-muted-foreground text-sm">
						HR & Payroll Management Suite
					</p>
				</div>

				<div>
					<h1 className="text-center font-bold text-2xl">Welcome Back</h1>
					<p className="mt-2 text-center text-muted-foreground text-sm">
						Sign in to your account to continue
					</p>
				</div>

				<Button
					className="mb-4 w-full"
					onClick={handleGoogleSignIn}
					type="button"
					variant="outline"
				>
					<GoogleIcon className="mr-2 h-5 w-5" />
					Continue with Google
				</Button>

				<div className="relative mb-4">
					<div className="absolute inset-0 flex items-center">
						<Separator />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background px-2 text-muted-foreground">
							Or continue with email
						</span>
					</div>
				</div>

				<form
					className="space-y-4"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<div>
						<form.Field name="email">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Email</Label>
									<Input
										id={field.name}
										name={field.name}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										type="email"
										value={field.state.value}
									/>
									{field.state.meta.errors.map((error) => (
										<p className="text-red-500" key={error?.message}>
											{error?.message}
										</p>
									))}
								</div>
							)}
						</form.Field>
					</div>

					<div>
						<form.Field name="password">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Password</Label>
									<Input
										id={field.name}
										name={field.name}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										type="password"
										value={field.state.value}
									/>
									{field.state.meta.errors.map((error) => (
										<p className="text-red-500" key={error?.message}>
											{error?.message}
										</p>
									))}
								</div>
							)}
						</form.Field>
					</div>

					<form.Subscribe>
						{(state) => (
							<Button
								className="w-full"
								disabled={!state.canSubmit || state.isSubmitting}
								type="submit"
							>
								{state.isSubmitting ? "Submitting..." : "Sign In"}
							</Button>
						)}
					</form.Subscribe>
				</form>

				<div className="mt-6 text-center">
					<Button
						className="text-primary hover:text-primary/80"
						onClick={onSwitchToSignUp}
						variant="link"
					>
						Need an account? Sign Up
					</Button>
				</div>
			</div>
		</div>
	);
}
