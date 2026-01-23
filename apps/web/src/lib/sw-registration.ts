/**
 * Service Worker Registration
 * Registers the service worker for PWA functionality
 */

export async function registerServiceWorker(): Promise<void> {
	// Check if service workers are supported
	if (!("serviceWorker" in navigator)) {
		console.log("Service workers are not supported in this browser");
		return;
	}

	try {
		// Wait for the page to load before registering
		await new Promise<void>((resolve) => {
			if (document.readyState === "complete") {
				resolve();
			} else {
				window.addEventListener("load", () => resolve());
			}
		});

		// Register the service worker
		const registration = await navigator.serviceWorker.register("/sw.js", {
			scope: "/",
		});

		console.log("Service Worker registered successfully:", registration.scope);

		// Check for updates every hour
		setInterval(
			() => {
				registration.update();
			},
			60 * 60 * 1000
		);

		// Listen for updates
		registration.addEventListener("updatefound", () => {
			const newWorker = registration.installing;
			if (!newWorker) {
				return;
			}

			newWorker.addEventListener("statechange", () => {
				if (
					newWorker.state === "installed" &&
					navigator.serviceWorker.controller
				) {
					// New service worker available
					console.log(
						"New service worker available. Refresh to update the app."
					);

					// Optionally show a notification to the user
					// biome-ignore lint/suspicious/noAlert: User confirmation required for app update
					if (window.confirm("A new version is available. Reload to update?")) {
						window.location.reload();
					}
				}
			});
		});
	} catch (error) {
		console.error("Service Worker registration failed:", error);
	}
}

/**
 * Unregister all service workers (for debugging/development)
 */
export async function unregisterServiceWorkers(): Promise<void> {
	if (!("serviceWorker" in navigator)) {
		return;
	}

	try {
		const registrations = await navigator.serviceWorker.getRegistrations();
		for (const registration of registrations) {
			await registration.unregister();
			console.log("Service Worker unregistered");
		}
	} catch (error) {
		console.error("Failed to unregister service workers:", error);
	}
}
