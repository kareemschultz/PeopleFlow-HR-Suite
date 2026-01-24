import { expect, test } from "@playwright/test";

// Regex patterns for test assertions
const HERO_HEADING = /Complete HR & Payroll/i;
const START_TRIAL_LINK = /Start 14-Day Free Trial/i;
const VIEW_DEMO_LINK = /View Demo Dashboard/i;
const FEATURES_HEADING = /Everything You Need to Manage Your Workforce/i;
const ABOUT_HEADING = /About PeopleFlow/i;
const CONTACT_HEADING = /Get In Touch/i;
const FIRST_NAME_LABEL = /First Name/i;
const LAST_NAME_LABEL = /Last Name/i;
const EMAIL_LABEL = /Email/i;
const MESSAGE_LABEL = /Message/i;
const SUPPORT_EMAIL = /support@peopleflow.com/i;
const DARK_CLASS = /dark/;

test.describe("Marketing Pages", () => {
	test("home page loads correctly", async ({ page }) => {
		await page.goto("/");

		// Check hero heading
		await expect(
			page.getByRole("heading", { name: HERO_HEADING })
		).toBeVisible();

		// Check CTA buttons
		await expect(
			page.getByRole("link", { name: START_TRIAL_LINK })
		).toBeVisible();
		await expect(
			page.getByRole("link", { name: VIEW_DEMO_LINK })
		).toBeVisible();

		// Check stats section
		await expect(page.getByText("99.9%")).toBeVisible();
		await expect(page.getByText("14-Day")).toBeVisible();
		await expect(page.getByText("Multi-Country")).toBeVisible();
		await expect(page.getByText("24/7")).toBeVisible();
	});

	test("features page loads correctly", async ({ page }) => {
		await page.goto("/features");

		// Check hero
		await expect(
			page.getByRole("heading", {
				name: FEATURES_HEADING,
			})
		).toBeVisible();

		// Check feature cards
		await expect(page.getByText("Employee Management")).toBeVisible();
		await expect(page.getByText("Advanced Payroll")).toBeVisible();
		await expect(page.getByText("Tax & Compliance")).toBeVisible();
		await expect(page.getByText("Leave Management")).toBeVisible();
	});

	test("about page loads correctly", async ({ page }) => {
		await page.goto("/about");

		// Check hero
		await expect(
			page.getByRole("heading", { name: ABOUT_HEADING })
		).toBeVisible();

		// Check mission and vision sections
		await expect(page.getByText("Our Mission")).toBeVisible();
		await expect(page.getByText("Our Vision")).toBeVisible();

		// Check team stats
		await expect(page.getByText("15+")).toBeVisible();
		await expect(page.getByText("50+")).toBeVisible();
		await expect(page.getByText("24/7")).toBeVisible();
	});

	test("contact page loads correctly", async ({ page }) => {
		await page.goto("/contact");

		// Check hero
		await expect(
			page.getByRole("heading", { name: CONTACT_HEADING })
		).toBeVisible();

		// Check form fields
		await expect(page.getByLabel(FIRST_NAME_LABEL)).toBeVisible();
		await expect(page.getByLabel(LAST_NAME_LABEL)).toBeVisible();
		await expect(page.getByLabel(EMAIL_LABEL)).toBeVisible();
		await expect(page.getByLabel(MESSAGE_LABEL)).toBeVisible();

		// Check contact info
		await expect(page.getByText(SUPPORT_EMAIL)).toBeVisible();
	});

	test("navigation works correctly", async ({ page }) => {
		await page.goto("/");

		// Test navigation
		await page.getByRole("link", { name: "Features" }).click();
		await expect(page).toHaveURL("/features");

		await page.getByRole("link", { name: "About" }).click();
		await expect(page).toHaveURL("/about");

		await page.getByRole("link", { name: "Contact" }).click();
		await expect(page).toHaveURL("/contact");

		await page.getByRole("link", { name: "Home" }).click();
		await expect(page).toHaveURL("/");
	});

	test("dark mode toggle works", async ({ page }) => {
		await page.goto("/");

		// Find and click theme toggle
		const themeToggle = page.locator('[aria-label*="theme"]').first();
		await themeToggle.click();

		// Check if dark class is applied
		const html = page.locator("html");
		await expect(html).toHaveClass(DARK_CLASS);
	});
});
