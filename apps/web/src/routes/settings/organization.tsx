import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
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

export const Route = createFileRoute("/settings/organization")({
	component: OrganizationSettingsPage,
});

function OrganizationSettingsPage() {
	// Using useState instead of react-hook-form to avoid type conflicts
	const [formData, setFormData] = useState({
		name: "Acme Corp",
		slug: "acme-corp",
		timezone: "America/Guyana",
		currency: "GYD",
		fiscalYearStart: 1,
		settings: {
			payrollFrequency: "monthly" as
				| "weekly"
				| "biweekly"
				| "monthly"
				| "semimonthly",
			payrollDayOfMonth: 25,
			annualLeaveDays: 20,
			sickLeaveDays: 10,
			requiresPayrollApproval: true,
			requiresLeaveApproval: true,
		},
	});

	const updateField = <K extends keyof typeof formData>(
		key: K,
		value: (typeof formData)[K]
	) => {
		setFormData((prev) => ({ ...prev, [key]: value }));
	};

	const updateSettingsField = <K extends keyof typeof formData.settings>(
		key: K,
		value: (typeof formData.settings)[K]
	) => {
		setFormData((prev) => ({
			...prev,
			settings: { ...prev.settings, [key]: value },
		}));
	};

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		toast.success("Organization settings updated", {
			description: "Your changes have been saved successfully.",
		});
		console.log(formData);
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
											id="slug"
											onChange={(e) => updateField("slug", e.target.value)}
											placeholder="acme-inc"
											value={formData.slug}
										/>
										<p className="text-muted-foreground text-sm">
											Your organization's unique identifier.
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
													value as typeof formData.settings.payrollFrequency
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
						<Button size="lg" type="submit">
							Save Changes
						</Button>
					</motion.div>
				</motion.div>
			</form>
		</div>
	);
}
