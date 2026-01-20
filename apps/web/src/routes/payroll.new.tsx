import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft02Icon as ArrowLeft } from "hugeicons-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useOrganization } from "@/hooks/use-organization";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/payroll/new")({
	component: NewPayrollRunPage,
});

type RunType =
	| "regular"
	| "bonus"
	| "thirteenth_month"
	| "retro_adjustment"
	| "final_settlement";

interface FormData {
	periodStart: string;
	periodEnd: string;
	payDate: string;
	runType: RunType;
	notes: string;
}

function getDefaultDates() {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();

	const periodStart = new Date(year, month, 1);
	const periodEnd = new Date(year, month + 1, 0);
	const payDate = new Date(year, month, 25);

	return {
		periodStart: periodStart.toISOString().split("T")[0] ?? "",
		periodEnd: periodEnd.toISOString().split("T")[0] ?? "",
		payDate: payDate.toISOString().split("T")[0] ?? "",
	};
}

function NewPayrollRunPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const {
		organizationId,
		hasOrganization,
		isLoading: orgLoading,
	} = useOrganization();

	const defaults = getDefaultDates();
	const [formData, setFormData] = useState<FormData>({
		periodStart: defaults.periodStart,
		periodEnd: defaults.periodEnd,
		payDate: defaults.payDate,
		runType: "regular",
		notes: "",
	});

	const createMutation = useMutation({
		mutationFn: (data: FormData) => {
			return orpc.payroll.create.call({
				organizationId,
				periodStart: data.periodStart,
				periodEnd: data.periodEnd,
				payDate: data.payDate,
				runType: data.runType,
				notes: data.notes || undefined,
			});
		},
		onSuccess: (result) => {
			toast.success("Payroll run created", {
				description: "You can now process the payroll to calculate payslips.",
			});
			queryClient.invalidateQueries({ queryKey: ["payroll"] });
			navigate({
				to: "/payroll/$payrollRunId",
				params: { payrollRunId: result.id },
			});
		},
		onError: (error) => {
			toast.error("Failed to create payroll run", {
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

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!hasOrganization) {
			toast.error("No organization selected");
			return;
		}
		createMutation.mutate(formData);
	}

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: { staggerChildren: 0.1 },
		},
	};

	const itemVariants = {
		hidden: { y: 20, opacity: 0 },
		visible: { y: 0, opacity: 1 },
	};

	if (orgLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="h-8 w-48 animate-pulse rounded bg-muted" />
			</div>
		);
	}

	if (!hasOrganization) {
		return (
			<div className="container mx-auto px-4 py-8">
				<Card className="p-12 text-center">
					<h2 className="font-semibold text-xl">No Organization</h2>
					<p className="mt-2 text-muted-foreground">
						You are not a member of any organization.
					</p>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-3xl px-4 py-8">
			<Button
				className="mb-6 gap-2"
				onClick={() => navigate({ to: "/payroll" })}
				variant="ghost"
			>
				<ArrowLeft className="h-4 w-4" />
				Back to Payroll
			</Button>

			<div className="mb-8">
				<h1 className="font-bold text-3xl">New Payroll Run</h1>
				<p className="text-muted-foreground">
					Create a new payroll run to process employee payments.
				</p>
			</div>

			<form onSubmit={onSubmit}>
				<motion.div
					animate="visible"
					className="space-y-6"
					initial="hidden"
					variants={containerVariants}
				>
					<motion.div variants={itemVariants}>
						<Card>
							<CardHeader>
								<CardTitle>Pay Period</CardTitle>
								<CardDescription>
									Define the period covered by this payroll run.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
									<div className="space-y-2">
										<Label htmlFor="periodStart">Period Start</Label>
										<Input
											id="periodStart"
											onChange={(e) =>
												updateField("periodStart", e.target.value)
											}
											required
											type="date"
											value={formData.periodStart}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="periodEnd">Period End</Label>
										<Input
											id="periodEnd"
											onChange={(e) => updateField("periodEnd", e.target.value)}
											required
											type="date"
											value={formData.periodEnd}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="payDate">Pay Date</Label>
										<Input
											id="payDate"
											onChange={(e) => updateField("payDate", e.target.value)}
											required
											type="date"
											value={formData.payDate}
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					</motion.div>

					<motion.div variants={itemVariants}>
						<Card>
							<CardHeader>
								<CardTitle>Payroll Type</CardTitle>
								<CardDescription>
									Select the type of payroll run.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label>Run Type</Label>
									<Select
										onValueChange={(value) =>
											updateField("runType", value as RunType)
										}
										value={formData.runType}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select run type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="regular">Regular Payroll</SelectItem>
											<SelectItem value="bonus">Bonus Payment</SelectItem>
											<SelectItem value="thirteenth_month">
												13th Month Pay
											</SelectItem>
											<SelectItem value="retro_adjustment">
												Retroactive Adjustment
											</SelectItem>
											<SelectItem value="final_settlement">
												Final Settlement
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<Separator />

								<div className="space-y-2">
									<Label htmlFor="notes">Notes (Optional)</Label>
									<Textarea
										id="notes"
										onChange={(e) => updateField("notes", e.target.value)}
										placeholder="Add any notes about this payroll run..."
										rows={3}
										value={formData.notes}
									/>
								</div>
							</CardContent>
						</Card>
					</motion.div>

					<motion.div
						className="flex justify-end gap-4"
						variants={itemVariants}
					>
						<Button
							onClick={() => navigate({ to: "/payroll" })}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button disabled={createMutation.isPending} type="submit">
							{createMutation.isPending ? "Creating..." : "Create Payroll Run"}
						</Button>
					</motion.div>
				</motion.div>
			</form>
		</div>
	);
}
