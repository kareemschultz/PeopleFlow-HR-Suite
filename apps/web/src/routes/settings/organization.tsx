import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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

const orgSettingsSchema = z.object({
	name: z.string().min(2, {
		message: "Organization name must be at least 2 characters.",
	}),
	slug: z.string().min(2).max(50),
	timezone: z.string(),
	currency: z.string().length(3),
	fiscalYearStart: z.coerce.number().min(1).max(12),

	// Settings JSONB
	settings: z.object({
		payrollFrequency: z.enum(["weekly", "biweekly", "monthly", "semimonthly"]),
		payrollDayOfMonth: z.coerce.number().min(1).max(31).optional(),
		annualLeaveDays: z.coerce.number().min(0).optional(),
		sickLeaveDays: z.coerce.number().min(0).optional(),
		requiresPayrollApproval: z.boolean().default(false),
		requiresLeaveApproval: z.boolean().default(false),
	}),
});

type OrgSettingsFormValues = z.infer<typeof orgSettingsSchema>;

// Default values simulating fetched data
const defaultValues: OrgSettingsFormValues = {
	name: "Acme Corp",
	slug: "acme-corp",
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
};

function OrganizationSettingsPage() {
	const form = useForm<OrgSettingsFormValues>({
		resolver: zodResolver(orgSettingsSchema),
		defaultValues,
	});

	function onSubmit(data: OrgSettingsFormValues) {
		toast.success("Organization settings updated", {
			description: "Your changes have been saved successfully.",
		});
		console.log(data);
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

			<Form {...form}>
				<form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
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
										<FormField
											control={form.control}
											name="name"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Organization Name</FormLabel>
													<FormControl>
														<Input placeholder="Acme Inc." {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="slug"
											render={({ field }) => (
												<FormItem>
													<FormLabel>URL Slug</FormLabel>
													<FormControl>
														<Input placeholder="acme-inc" {...field} />
													</FormControl>
													<FormDescription>
														Your organization's unique identifier.
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
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
										<FormField
											control={form.control}
											name="timezone"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Timezone</FormLabel>
													<FormControl>
														<Input {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="currency"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Currency</FormLabel>
													<FormControl>
														<Input {...field} maxLength={3} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="fiscalYearStart"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Fiscal Year Start (Month)</FormLabel>
													<FormControl>
														<Input max={12} min={1} type="number" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
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
										<FormField
											control={form.control}
											name="settings.payrollFrequency"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Frequency</FormLabel>
													<Select
														defaultValue={field.value}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select frequency" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="weekly">Weekly</SelectItem>
															<SelectItem value="biweekly">
																Bi-weekly
															</SelectItem>
															<SelectItem value="semimonthly">
																Semi-monthly
															</SelectItem>
															<SelectItem value="monthly">Monthly</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="settings.payrollDayOfMonth"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Pay Day (Day of Month)</FormLabel>
													<FormControl>
														<Input max={31} min={1} type="number" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<FormField
										control={form.control}
										name="settings.requiresPayrollApproval"
										render={({ field }) => (
											<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
												<div className="space-y-1 leading-none">
													<FormLabel>Require Payroll Approval</FormLabel>
													<FormDescription>
														Payroll runs must be explicitly approved by an admin
														before completion.
													</FormDescription>
												</div>
											</FormItem>
										)}
									/>
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
			</Form>
		</div>
	);
}
