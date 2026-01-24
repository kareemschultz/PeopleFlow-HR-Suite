import { createFileRoute } from "@tanstack/react-router";
import { Location01Icon, Mail01Icon, SmartPhone01Icon } from "hugeicons-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

export const Route = createFileRoute("/contact")({
	component: ContactPage,
});

function ContactPage() {
	const contactInfo = [
		{
			icon: Mail01Icon,
			title: "Email",
			content: "support@peopleflow.com",
			link: "mailto:support@peopleflow.com",
		},
		{
			icon: SmartPhone01Icon,
			title: "Phone",
			content: "+1 (555) 123-4567",
			link: "tel:+15551234567",
		},
		{
			icon: Location01Icon,
			title: "Office",
			content: "123 Business St, Suite 100\nSan Francisco, CA 94105",
			link: null,
		},
	];

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		// Handle form submission
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Hero */}
			<section className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-6 py-24 lg:px-8 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950">
				<div className="mx-auto max-w-4xl text-center">
					<h1 className="font-bold text-4xl tracking-tight sm:text-6xl">
						<span className="text-gray-900 dark:text-white">Get In</span>
						<br />
						<span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-cyan-400 dark:to-blue-400">
							Touch
						</span>
					</h1>
					<p className="mt-6 text-gray-600 text-lg leading-8 dark:text-gray-300">
						Have questions? We're here to help. Our team typically responds
						within 24 hours.
					</p>
				</div>
			</section>

			{/* Contact Form & Info */}
			<section className="px-6 py-24 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
						{/* Contact Form */}
						<div>
							<h2 className="font-bold text-3xl">Send us a message</h2>
							<p className="mt-4 text-muted-foreground">
								Fill out the form below and we'll get back to you as soon as
								possible.
							</p>

							<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="firstName">First Name *</Label>
										<Input id="firstName" required />
									</div>
									<div className="space-y-2">
										<Label htmlFor="lastName">Last Name *</Label>
										<Input id="lastName" required />
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="email">Email *</Label>
									<Input id="email" required type="email" />
								</div>

								<div className="space-y-2">
									<Label htmlFor="company">Company</Label>
									<Input id="company" />
								</div>

								<div className="space-y-2">
									<Label htmlFor="phone">Phone</Label>
									<Input id="phone" type="tel" />
								</div>

								<div className="space-y-2">
									<Label htmlFor="inquiryType">Inquiry Type</Label>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder="Select inquiry type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="sales">Sales Inquiry</SelectItem>
											<SelectItem value="support">Technical Support</SelectItem>
											<SelectItem value="demo">Request Demo</SelectItem>
											<SelectItem value="partner">Partnership</SelectItem>
											<SelectItem value="other">Other</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="message">Message *</Label>
									<Textarea
										id="message"
										placeholder="Tell us how we can help..."
										required
										rows={6}
									/>
								</div>

								<Button className="w-full" size="lg" type="submit">
									Send Message
								</Button>
							</form>
						</div>

						{/* Contact Info */}
						<div className="space-y-8">
							<div>
								<h2 className="font-bold text-3xl">Contact Information</h2>
								<p className="mt-4 text-muted-foreground">
									Prefer to reach out directly? Here's how to get in touch.
								</p>
							</div>

							<div className="space-y-6">
								{contactInfo.map((info) => (
									<Card
										className="border-2 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
										key={info.title}
									>
										<div className="flex items-start gap-4">
											<div className="rounded-lg bg-primary/10 p-3">
												<info.icon className="h-6 w-6 text-primary" />
											</div>
											<div>
												<h3 className="font-semibold text-lg">{info.title}</h3>
												{info.link ? (
													<a
														className="mt-1 text-muted-foreground hover:text-primary"
														href={info.link}
													>
														{info.content}
													</a>
												) : (
													<p className="mt-1 whitespace-pre-line text-muted-foreground">
														{info.content}
													</p>
												)}
											</div>
										</div>
									</Card>
								))}
							</div>

							{/* Business Hours */}
							<Card className="border-2 p-6">
								<h3 className="font-semibold text-lg">Business Hours</h3>
								<div className="mt-4 space-y-2 text-muted-foreground text-sm">
									<div className="flex justify-between">
										<span>Monday - Friday</span>
										<span className="font-medium">9:00 AM - 6:00 PM PST</span>
									</div>
									<div className="flex justify-between">
										<span>Saturday</span>
										<span className="font-medium">10:00 AM - 4:00 PM PST</span>
									</div>
									<div className="flex justify-between">
										<span>Sunday</span>
										<span className="font-medium">Closed</span>
									</div>
								</div>
								<p className="mt-4 text-muted-foreground text-sm">
									* Email support is available 24/7. We aim to respond to all
									inquiries within 24 hours.
								</p>
							</Card>
						</div>
					</div>
				</div>
			</section>

			{/* FAQ */}
			<section className="bg-muted/50 px-6 py-24 lg:px-8">
				<div className="mx-auto max-w-4xl">
					<h2 className="text-center font-bold text-3xl">
						Frequently Asked Questions
					</h2>
					<div className="mt-12 space-y-8">
						<div>
							<h3 className="font-semibold text-lg">
								How quickly will I get a response?
							</h3>
							<p className="mt-2 text-muted-foreground">
								We aim to respond to all inquiries within 24 hours. Urgent
								support requests are prioritized and typically answered within 4
								hours during business hours.
							</p>
						</div>
						<div>
							<h3 className="font-semibold text-lg">
								Can I schedule a product demo?
							</h3>
							<p className="mt-2 text-muted-foreground">
								Yes! Select "Request Demo" in the inquiry type and we'll set up
								a personalized walkthrough of PeopleFlow at a time that works
								for you.
							</p>
						</div>
						<div>
							<h3 className="font-semibold text-lg">
								Do you offer phone support?
							</h3>
							<p className="mt-2 text-muted-foreground">
								Phone support is available for Professional and Enterprise plan
								customers. Starter plan customers receive email and chat
								support.
							</p>
						</div>
						<div>
							<h3 className="font-semibold text-lg">
								Where is your office located?
							</h3>
							<p className="mt-2 text-muted-foreground">
								Our headquarters is in San Francisco, CA, but our team works
								remotely across multiple time zones to provide better coverage
								and support.
							</p>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
