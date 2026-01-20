import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization } from "@/hooks/use-organization";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/settings/organization")({
	component: OrganizationSettingsPage,
});

type PayrollFrequency = "weekly" | "biweekly" | "monthly" | "semimonthly";

interface FormData {
	name: string;
	slug: string;
	timezone: string;
	currency: string;
	fiscalYearStart: number;
	settings: {
		payrollFrequency: PayrollFrequency;
		payrollDayOfMonth: number;
		annualLeaveDays: number;
		sickLeaveDays: number;
		requiresPayrollApproval: boolean;
		requiresLeaveApproval: boolean;
	};
}

function OrganizationSettingsPage() {
	const { organization, organizationId, isLoading, hasOrganization } =
		useOrganization();
	const queryClient = useQueryClient();

	const [formData, setFormData] = useState<FormData>({
		name: "",
		slug: "",
		timezone: "America/Guyana",
		currency: "GYD",
		fiscalYearStart: 1,
		settings: {
			payrollFrequency: "monthly",
			payrollDayOfMonth: 25,
			annualLeaveDays: 20,
			sickLeaveDays: 10,
			requiresPayrollApproval: true,
			requiresLeaveApproval: true,
		},
	});

	// Populate form when organization loads
	useEffect(() => {
		if (organization) {
			setFormData({
				name: organization.name,
				slug: organization.slug,
				timezone: organization.timezone,
				currency: organization.currency,
				fiscalYearStart: organization.fiscalYearStart,
				settings: {
					payrollFrequency:
						(organization.settings?.payrollFrequency as PayrollFrequency) ??
						"monthly",
					payrollDayOfMonth: organization.settings?.payrollDayOfMonth ?? 25,
					annualLeaveDays: organization.settings?.annualLeaveDays ?? 20,
					sickLeaveDays: organization.settings?.sickLeaveDays ?? 10,
					requiresPayrollApproval:
						organization.settings?.requiresPayrollApproval ?? true,
					requiresLeaveApproval:
						organization.settings?.requiresLeaveApproval ?? true,
				},
			});
		}
	}, [organization]);

	const updateMutation = useMutation({
		mutationFn: async (data: FormData) => {
			const client = orpc.organizations.update;
			return client.call({
				id: organizationId,
				name: data.name,
				timezone: data.timezone,
				currency: data.currency,
				fiscalYearStart: data.fiscalYearStart,
				settings: data.settings,
			});
		},
		onSuccess: () => {
			toast.success("Organization settings updated", {
				description: "Your changes have been saved successfully.",
			});
			queryClient.invalidateQueries({
				queryKey: ["organizations", "myOrganizations"],
			});
		},
		onError: (error) => {
			toast.error("Failed to update settings", {
				description:
					error instanceof Error ? error.message : "An error occurred",
			});
		},
	});

	const updateField = <K extends keyof FormData>(
		key: K,
		value: FormData[K]
	) => {
		setFormData((prev) => ({ ...prev, [key]: value }));
	};

	const updateSettingsField = <K extends keyof FormData["settings"]>(
		key: K,
		value: FormData["settings"][K]
	) => {
		setFormData((prev) => ({
			...prev,
			settings: { ...prev.settings, [key]: value },
		}));
	};

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!hasOrganization) {
			toast.error("No organization selected");
			return;
		}
		updateMutation.mutate(formData);
	}

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
			},
		},
	};

	const itemVariants = {
		hidden: { y: 20, opacity: 0 },
		visible: {
			y: 0,
			opacity: 1,
		},
	};

	if (isLoading) {
		return (
			<div className="space-y-6 p-6">
				<div>
					<Skeleton className="h-8 w-64" />
					<Skeleton className="mt-2 h-4 w-96" />
				</div>
				<Separator />
				<div className="space-y-6">
					{[1, 2, 3].map((i) => (
						<Card key={i}>
							<CardHeader>
								<Skeleton className="h-6 w-48" />
								<Skeleton className="h-4 w-64" />
							</CardHeader>
							<CardContent className="space-y-4">
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	if (!hasOrganization) {
		return (
			<div className="flex flex-col items-center justify-center p-12">
				<h2 className="font-semibold text-xl">No Organization</h2>
				<p className="mt-2 text-muted-foreground">
					You are not a member of any organization. Please contact your
					administrator.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="font-semibold text-2xl tracking-tight">
					Organization Settings
				</h1>
				<p className="text-muted-foreground text-sm">
					Manage your company profile and global configuration.
				</p>
			</div>

			<Separator />

			<form className="space-y-8" onSubmit={onSubmit}>
				<motion.div
					animate="visible"
					className="space-y-6"
					initial="hidden"
					variants={containerVariants}
				>
					{/* General Information */}
					<motion.div variants={itemVariants}>
						<Card>
							<CardHeader>
								<CardTitle>General Information</CardTitle>
								<CardDescription>
									Basic details about your organization.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="name">Organization Name</Label>
										<Input
											id="name"
											onChange={(e) => updateField("name", e.target.value)}
											placeholder="Acme Inc."
											value={formData.name}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="slug">URL Slug</Label>
										<Input
											disabled
											id="slug"
											placeholder="acme-inc"
											value={formData.slug}
										/>
										<p className="text-muted-foreground text-sm">
											Your organization's unique identifier (read-only).
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</motion.div>

					{/* Regional Settings */}
					<motion.div variants={itemVariants}>
						<Card>
							<CardHeader>
								<CardTitle>Regional & Fiscal</CardTitle>
								<CardDescription>
									Currency, timezone, and fiscal year settings.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
									<div className="space-y-2">
										<Label htmlFor="timezone">Timezone</Label>
										<Input
											id="timezone"
											onChange={(e) => updateField("timezone", e.target.value)}
											value={formData.timezone}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="currency">Currency</Label>
										<Input
											id="currency"
											maxLength={3}
											onChange={(e) => updateField("currency", e.target.value)}
											value={formData.currency}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="fiscalYearStart">
											Fiscal Year Start (Month)
										</Label>
										<Input
											id="fiscalYearStart"
											max={12}
											min={1}
											onChange={(e) =>
												updateField("fiscalYearStart", Number(e.target.value))
											}
											type="number"
											value={formData.fiscalYearStart}
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					</motion.div>

					{/* Payroll Configuration */}
					<motion.div variants={itemVariants}>
						<Card>
							<CardHeader>
								<CardTitle>Payroll Configuration</CardTitle>
								<CardDescription>
									Configure how payroll is calculated and processed.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label>Frequency</Label>
										<Select
											onValueChange={(value) =>
												updateSettingsField(
													"payrollFrequency",
													value as PayrollFrequency
												)
											}
											value={formData.settings.payrollFrequency}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select frequency" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="weekly">Weekly</SelectItem>
												<SelectItem value="biweekly">Bi-weekly</SelectItem>
												<SelectItem value="semimonthly">
													Semi-monthly
												</SelectItem>
												<SelectItem value="monthly">Monthly</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="payrollDayOfMonth">
											Pay Day (Day of Month)
										</Label>
										<Input
											id="payrollDayOfMonth"
											max={31}
											min={1}
											onChange={(e) =>
												updateSettingsField(
													"payrollDayOfMonth",
													Number(e.target.value)
												)
											}
											type="number"
											value={formData.settings.payrollDayOfMonth}
										/>
									</div>
								</div>

								<div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
									<Checkbox
										checked={formData.settings.requiresPayrollApproval}
										id="requiresPayrollApproval"
										onCheckedChange={(checked) =>
											updateSettingsField(
												"requiresPayrollApproval",
												checked === true
											)
										}
									/>
									<div className="space-y-1 leading-none">
										<Label htmlFor="requiresPayrollApproval">
											Require Payroll Approval
										</Label>
										<p className="text-muted-foreground text-sm">
											Payroll runs must be explicitly approved by an admin
											before completion.
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</motion.div>

					<motion.div className="flex justify-end" variants={itemVariants}>
						<Button disabled={updateMutation.isPending} size="lg" type="submit">
							{updateMutation.isPending ? "Saving..." : "Save Changes"}
						</Button>
					</motion.div>
				</motion.div>
			</form>
		</div>
	);
}
