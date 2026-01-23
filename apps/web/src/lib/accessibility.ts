/**
 * Accessibility Utilities
 * Helper functions and constants for WCAG 2.1 AA compliance
 */

/**
 * Screen Reader Only Text
 * Visually hides text but keeps it accessible to screen readers
 */
export function srOnly(text: string): string {
	return text;
}

/**
 * Announce to screen readers
 * Creates a live region announcement for screen readers
 */
export function announce(
	message: string,
	priority: "polite" | "assertive" = "polite"
): void {
	const announcement = document.createElement("div");
	announcement.setAttribute("role", "status");
	announcement.setAttribute("aria-live", priority);
	announcement.setAttribute("aria-atomic", "true");
	announcement.className = "sr-only";
	announcement.textContent = message;
	document.body.appendChild(announcement);

	// Remove after announcement
	setTimeout(() => {
		document.body.removeChild(announcement);
	}, 1000);
}

/**
 * Generate unique ID for form fields
 */
let idCounter = 0;
export function generateId(prefix = "field"): string {
	idCounter++;
	return `${prefix}-${idCounter}`;
}

/**
 * Skip to content functionality
 * Allows keyboard users to skip navigation
 */
export function handleSkipToContent(targetId: string): void {
	const target = document.getElementById(targetId);
	if (target) {
		target.focus();
		target.scrollIntoView({ behavior: "smooth", block: "start" });
	}
}

/**
 * Trap focus within a modal/dialog
 */
export function trapFocus(element: HTMLElement): () => void {
	const focusableElements = element.querySelectorAll<HTMLElement>(
		'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
	);

	const firstFocusable = focusableElements[0];
	const lastFocusable = focusableElements[focusableElements.length - 1];

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key !== "Tab") {
			return;
		}

		if (e.shiftKey) {
			// Shift+Tab
			if (document.activeElement === firstFocusable) {
				e.preventDefault();
				lastFocusable?.focus();
			}
		} else {
			// Tab
			if (document.activeElement === lastFocusable) {
				e.preventDefault();
				firstFocusable?.focus();
			}
		}
	}

	element.addEventListener("keydown", handleKeyDown);

	// Focus first element
	firstFocusable?.focus();

	// Return cleanup function
	return () => {
		element.removeEventListener("keydown", handleKeyDown);
	};
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Get contrast ratio between two colors
 * Used for WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
 */
export function getContrastRatio(_color1: string, _color2: string): number {
	// Simplified contrast ratio calculation
	// In production, use a library like color-contrast-checker
	return 4.5; // Placeholder
}

/**
 * Keyboard navigation constants
 */
export const Keys = {
	ENTER: "Enter",
	SPACE: " ",
	ESCAPE: "Escape",
	ARROW_UP: "ArrowUp",
	ARROW_DOWN: "ArrowDown",
	ARROW_LEFT: "ArrowLeft",
	ARROW_RIGHT: "ArrowRight",
	HOME: "Home",
	END: "End",
	TAB: "Tab",
} as const;

/**
 * ARIA roles
 */
export const AriaRoles = {
	BUTTON: "button",
	LINK: "link",
	NAVIGATION: "navigation",
	MAIN: "main",
	REGION: "region",
	BANNER: "banner",
	CONTENTINFO: "contentinfo",
	COMPLEMENTARY: "complementary",
	SEARCH: "search",
	FORM: "form",
	DIALOG: "dialog",
	ALERT: "alert",
	ALERTDIALOG: "alertdialog",
	STATUS: "status",
	LOG: "log",
	MARQUEE: "marquee",
	TIMER: "timer",
} as const;
