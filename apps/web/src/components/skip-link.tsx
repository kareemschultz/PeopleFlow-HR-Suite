/**
 * Skip to Content Link
 * Allows keyboard users to skip navigation and go directly to main content
 * WCAG 2.1 AA Success Criterion 2.4.1 (Bypass Blocks)
 */

export default function SkipLink() {
	return (
		// biome-ignore lint/a11y/useValidAnchor: Skip links must use anchor with href for keyboard navigation
		<a
			className="skip-link"
			href="#main-content"
			onClick={(e) => {
				e.preventDefault();
				const main = document.getElementById("main-content");
				if (main) {
					main.focus();
					main.scrollIntoView({ behavior: "smooth", block: "start" });
				}
			}}
		>
			Skip to main content
		</a>
	);
}
