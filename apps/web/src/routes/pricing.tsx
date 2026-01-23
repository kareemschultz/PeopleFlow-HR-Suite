import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	CheckmarkCircle02Icon as Check,
	Mail01Icon as Mail,
} from "hugeicons-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useOrganization } from "@/hooks/use-organization";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/pricing")({
	component: PricingPage,
});

interface PricingTier {
	name: string;
	description: string;
	price: string;
	period: string;
	features: string[];
	highlighted?: boolean;
	cta: string;
	plan?: "starter_monthly" | "pro_monthly" | "starter_yearly" | "pro_yearly";
}

const pricingTiers: PricingTier[] = [
	{
		name: "Starter",
		description: "Perfect for small businesses",
		price: "$49",
		period: "/month",
		features: [
			"Up to 10 employees",
			"Basic payroll processing",
			"Employee management",
			"Department structure",
			"Email support",
			"Standard reports",
		],
		cta: "Start Free Trial",
		plan: "starter_monthly",
	},
	{
		name: "Professional",
		description: "For growing companies",
		price: "$199",
		period: "/month",
		features: [
			"Up to 100 employees",
			"Advanced payroll features",
			"Multi-jurisdiction tax support",
			"Retroactive adjustments",
			"Analytics & metrics",
			"Priority support",
			"Custom reports",
			"API access",
		],
		highlighted: true,
		cta: "Start Free Trial",
		plan: "pro_monthly",
	},
	{
		name: "Enterprise",
		description: "For large organizations",
		price: "Custom",
		period: "",
		features: [
			"Unlimited employees",
			"Multi-country support",
			"Dedicated account manager",
			"Custom integrations",
			"Advanced security (SSO)",
			"Custom branding",
			"SLA guarantee",
			"White-label options",
		],
		cta: "Contact Sales",
	},
];

function PricingPage() {
	const navigate = useNavigate();
	const { organizationId } = useOrganization();
	const queryClient = useQueryClient();

	const [isContactOpen, setIsContactOpen] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		company: "",
		phone: "",
		inquiryType: "enterprise" as
			| "on_prem"
			| "enterprise"
			| "custom"
			| "partner",
		employeeCount: "",
		message: "",
	});

	// Mutation for starting a trial
	const startTrialMutation = useMutation({
		...orpc.licensing.createSubscription.mutationOptions(),
		onSuccess: () => {
			toast.success(
				"Trial started! You have 14 days of free access to all features."
			);
			queryClient.invalidateQueries({ queryKey: ["licensing"] });
			navigate({ to: "/dashboard" });
		},
		onError: (error: Error) => {
			toast.error(`Failed to start trial: ${error.message}`);
		},
	});

	const submitInquiry = useMutation({
		...orpc.licensing.submitInquiry.mutationOptions(),
		onSuccess: () => {
			toast.success("Thank you! Our team will contact you within 24 hours.");
			setIsContactOpen(false);
			setFormData({
				name: "",
				email: "",
				company: "",
				phone: "",
				inquiryType: "enterprise",
				employeeCount: "",
				message: "",
			});
		},
		onError: (error: Error) => {
			toast.error(`Failed to submit inquiry: ${error.message}`);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		submitInquiry.mutate({
			name: formData.name,
			email: formData.email,
			company: formData.company || undefined,
			phone: formData.phone || undefined,
			inquiryType: formData.inquiryType,
			employeeCount: formData.employeeCount
				? Number.parseInt(formData.employeeCount, 10)
				: undefined,
			message: formData.message || undefined,
		});
	};

	const handleCTAClick = (tier: PricingTier) => {
		if (tier.name === "Enterprise") {
			setFormData((prev) => ({ ...prev, inquiryType: "enterprise" }));
			setIsContactOpen(true);
		} else if (tier.plan) {
			// Start 14-day trial
			if (!organizationId) {
				toast.error("Please create an organization first");
				return;
			}

			startTrialMutation.mutate({
				organizationId,
				plan: tier.plan,
				stripeSubscriptionId: undefined,
				stripeCustomerId: undefined,
			});
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
			{/* Header */}
			<div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<h1 className="font-bold text-4xl tracking-tight sm:text-5xl">
						Simple, Transparent Pricing
					</h1>
					<p className="mt-6 text-lg text-muted-foreground leading-8">
						Choose the plan that's right for your organization. All plans
						include a 14-day free trial.
					</p>
				</div>

				{/* Pricing Cards */}
				<div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-3">
					{pricingTiers.map((tier) => (
						<Card
							className={`relative p-8 ${tier.highlighted ? "border-primary shadow-xl ring-2 ring-primary" : ""}`}
							key={tier.name}
						>
							{tier.highlighted && (
								<div className="absolute -top-4 left-1/2 -translate-x-1/2">
									<span className="inline-flex rounded-full bg-primary px-4 py-1 font-semibold text-primary-foreground text-sm">
										Most Popular
									</span>
								</div>
							)}

							<div className="mb-8">
								<h3 className="font-semibold text-2xl">{tier.name}</h3>
								<p className="mt-2 text-muted-foreground text-sm">
									{tier.description}
								</p>
								<div className="mt-6 flex items-baseline">
									<span className="font-bold text-5xl tracking-tight">
										{tier.price}
									</span>
									{tier.period && (
										<span className="ml-2 text-muted-foreground text-sm">
											{tier.period}
										</span>
									)}
								</div>
							</div>

							<ul className="mb-8 space-y-3">
								{tier.features.map((feature) => (
									<li className="flex items-start gap-3" key={feature}>
										<Check className="mt-1 h-5 w-5 shrink-0 text-primary" />
										<span className="text-sm">{feature}</span>
									</li>
								))}
							</ul>

							<Button
								className="w-full"
								onClick={() => handleCTAClick(tier)}
								variant={tier.highlighted ? "default" : "outline"}
							>
								{tier.cta}
							</Button>
						</Card>
					))}
				</div>

				{/* On-Premise Option */}
				<Card className="mx-auto mt-16 max-w-4xl border-2 p-8">
					<div className="grid gap-8 lg:grid-cols-2">
						<div>
							<h3 className="font-semibold text-2xl">On-Premise Deployment</h3>
							<p className="mt-4 text-muted-foreground">
								Need complete control over your data? Deploy PeopleFlow HR Suite
								on your own infrastructure with our perpetual license option.
							</p>
							<ul className="mt-6 space-y-3">
								<li className="flex items-start gap-3">
									<Check className="mt-1 h-5 w-5 shrink-0 text-primary" />
									<span className="text-sm">One-time perpetual license</span>
								</li>
								<li className="flex items-start gap-3">
									<Check className="mt-1 h-5 w-5 shrink-0 text-primary" />
									<span className="text-sm">Deploy on your own servers</span>
								</li>
								<li className="flex items-start gap-3">
									<Check className="mt-1 h-5 w-5 shrink-0 text-primary" />
									<span className="text-sm">
										Full data sovereignty & compliance
									</span>
								</li>
								<li className="flex items-start gap-3">
									<Check className="mt-1 h-5 w-5 shrink-0 text-primary" />
									<span className="text-sm">
										Optional maintenance & support
									</span>
								</li>
								<li className="flex items-start gap-3">
									<Check className="mt-1 h-5 w-5 shrink-0 text-primary" />
									<span className="text-sm">Custom integrations available</span>
								</li>
							</ul>
						</div>
						<div className="flex flex-col justify-center">
							<Button
								onClick={() => {
									setFormData((prev) => ({
										...prev,
										inquiryType: "on_prem",
									}));
									setIsContactOpen(true);
								}}
								size="lg"
							>
								<Mail className="mr-2 h-5 w-5" />
								Request On-Premise Pricing
							</Button>
							<p className="mt-4 text-center text-muted-foreground text-sm">
								Our team will provide a custom quote based on your needs
							</p>
						</div>
					</div>
				</Card>

				{/* FAQ Section */}
				<div className="mx-auto mt-16 max-w-2xl">
					<h2 className="mb-8 text-center font-semibold text-3xl">
						Frequently Asked Questions
					</h2>
					<div className="space-y-6">
						<div>
							<h3 className="font-semibold text-lg">
								Can I switch plans later?
							</h3>
							<p className="mt-2 text-muted-foreground">
								Yes! You can upgrade or downgrade your plan at any time. Changes
								take effect at the start of your next billing cycle.
							</p>
						</div>
						<div>
							<h3 className="font-semibold text-lg">
								What payment methods do you accept?
							</h3>
							<p className="mt-2 text-muted-foreground">
								We accept all major credit cards, bank transfers, and PayPal for
								annual plans. Enterprise customers can also arrange invoice
								billing.
							</p>
						</div>
						<div>
							<h3 className="font-semibold text-lg">Is there a free trial?</h3>
							<p className="mt-2 text-muted-foreground">
								Yes! All SaaS plans include a 14-day free trial. No credit card
								required to get started.
							</p>
						</div>
						<div>
							<h3 className="font-semibold text-lg">
								What's included in on-premise deployment?
							</h3>
							<p className="mt-2 text-muted-foreground">
								On-premise licenses include the complete software, deployment
								documentation, and initial setup support. Ongoing maintenance
								and updates are available as an optional annual subscription.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Contact Dialog */}
			<Dialog onOpenChange={setIsContactOpen} open={isContactOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Contact Sales</DialogTitle>
						<DialogDescription>
							Fill out the form below and our team will get back to you within
							24 hours.
						</DialogDescription>
					</DialogHeader>
					<form className="space-y-4" onSubmit={handleSubmit}>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="name">Name *</Label>
								<Input
									id="name"
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											name: e.target.value,
										}))
									}
									required
									value={formData.name}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email *</Label>
								<Input
									id="email"
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, email: e.target.value }))
									}
									required
									type="email"
									value={formData.email}
								/>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="company">Company</Label>
								<Input
									id="company"
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											company: e.target.value,
										}))
									}
									value={formData.company}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="phone">Phone</Label>
								<Input
									id="phone"
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, phone: e.target.value }))
									}
									type="tel"
									value={formData.phone}
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="inquiryType">Inquiry Type</Label>
							<Select
								onValueChange={(value) =>
									setFormData((prev) => ({
										...prev,
										inquiryType: value as
											| "on_prem"
											| "enterprise"
											| "custom"
											| "partner",
									}))
								}
								value={formData.inquiryType}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="enterprise">
										Enterprise SaaS Plan
									</SelectItem>
									<SelectItem value="on_prem">On-Premise Deployment</SelectItem>
									<SelectItem value="custom">Custom Solution</SelectItem>
									<SelectItem value="partner">Partnership Inquiry</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="employeeCount">Number of Employees</Label>
							<Input
								id="employeeCount"
								min="1"
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										employeeCount: e.target.value,
									}))
								}
								type="number"
								value={formData.employeeCount}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="message">Message</Label>
							<Textarea
								id="message"
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, message: e.target.value }))
								}
								placeholder="Tell us about your requirements..."
								rows={4}
								value={formData.message}
							/>
						</div>
						<DialogFooter>
							<Button
								onClick={() => setIsContactOpen(false)}
								type="button"
								variant="outline"
							>
								Cancel
							</Button>
							<Button disabled={submitInquiry.isPending} type="submit">
								{submitInquiry.isPending ? "Submitting..." : "Submit Inquiry"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
