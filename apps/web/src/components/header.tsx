import { Link, useRouterState } from "@tanstack/react-router";
import { Cancel01Icon, Menu01Icon } from "hugeicons-react";
import { useState } from "react";

import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import UserMenu from "./user-menu";

export default function Header() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const routerState = useRouterState();

	// Determine if we're on a marketing/public page
	const isMarketingPage =
		routerState.location.pathname === "/" ||
		routerState.location.pathname === "/pricing" ||
		routerState.location.pathname === "/login" ||
		routerState.location.pathname === "/features" ||
		routerState.location.pathname === "/about" ||
		routerState.location.pathname === "/contact";

	// Marketing pages show minimal navigation
	const marketingLinks = [
		{ to: "/", label: "Home" },
		{ to: "/features", label: "Features" },
		{ to: "/pricing", label: "Pricing" },
		{ to: "/about", label: "About" },
		{ to: "/contact", label: "Contact" },
	] as const;

	// App pages show full navigation
	const appLinks = [
		{ to: "/dashboard", label: "Dashboard" },
		{ to: "/employees", label: "Employees" },
		{ to: "/departments", label: "Departments" },
		{ to: "/payroll", label: "Payroll" },
		{ to: "/reports", label: "Reports" },
		{ to: "/settings", label: "Settings" },
	] as const;

	const links = isMarketingPage ? marketingLinks : appLinks;

	return (
		<header className="border-border border-b bg-background">
			{/* Desktop Header */}
			<div className="flex flex-row items-center justify-between px-4 py-3 md:px-6">
				{/* Logo/Brand - Always visible */}
				<div className="flex items-center gap-2">
					<Link aria-label="PeopleFlow Home" to="/">
						<span className="font-bold text-xl">PeopleFlow</span>
					</Link>
				</div>

				{/* Desktop Navigation - Hidden on mobile */}
				<nav
					aria-label="Main navigation"
					className="hidden items-center gap-6 md:flex"
				>
					{links.map(({ to, label }) => {
						return (
							<Link
								activeOptions={{ exact: to === "/" }}
								activeProps={{
									className: "text-primary font-semibold",
								}}
								className="text-foreground transition-colors hover:text-primary"
								key={to}
								to={to}
							>
								{label}
							</Link>
						);
					})}
				</nav>

				{/* Right side controls */}
				<div className="flex items-center gap-2">
					<ModeToggle />
					{!isMarketingPage && <UserMenu />}
					{isMarketingPage && (
						<Link to="/login">
							<Button size="sm" variant="default">
								Get Started
							</Button>
						</Link>
					)}
					{/* Mobile Menu Button - Only visible on mobile */}
					<Button
						aria-controls="mobile-menu"
						aria-expanded={mobileMenuOpen}
						aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
						className="md:hidden"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						size="icon"
						variant="ghost"
					>
						{mobileMenuOpen ? (
							<Cancel01Icon aria-hidden="true" className="h-5 w-5" />
						) : (
							<Menu01Icon aria-hidden="true" className="h-5 w-5" />
						)}
					</Button>
				</div>
			</div>

			{/* Mobile Navigation - Only visible when menu is open */}
			{mobileMenuOpen && (
				<nav
					aria-label="Main navigation"
					className="border-border border-t md:hidden"
					id="mobile-menu"
				>
					<div className="flex flex-col space-y-1 p-4">
						{links.map(({ to, label }) => {
							return (
								<Link
									activeOptions={{ exact: to === "/" }}
									activeProps={{
										className: "bg-primary/10 text-primary",
									}}
									className="rounded-lg px-3 py-2 text-foreground transition-colors hover:bg-muted"
									key={to}
									onClick={() => setMobileMenuOpen(false)}
									to={to}
								>
									{label}
								</Link>
							);
						})}
					</div>
				</nav>
			)}
		</header>
	);
}
