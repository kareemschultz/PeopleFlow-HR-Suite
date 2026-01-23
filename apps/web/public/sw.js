const CACHE_NAME = "peopleflow-v1";
const urlsToCache = [
	"/",
	"/dashboard",
	"/employees",
	"/departments",
	"/payroll",
	"/reports",
	"/settings",
];

// Install service worker and cache resources
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			console.log("Service Worker: Caching files");
			return cache.addAll(urlsToCache).catch((err) => {
				console.error("Service Worker: Cache failed", err);
			});
		})
	);
	self.skipWaiting();
});

// Activate service worker and clean up old caches
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				// biome-ignore lint/suspicious/useIterableCallbackReturn: Service worker cleanup returns undefined for current cache
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME) {
						console.log("Service Worker: Clearing old cache", cacheName);
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
	self.clients.claim();
});

// Fetch strategy: Network first, fallback to cache
self.addEventListener("fetch", (event) => {
	// Skip non-GET requests
	if (event.request.method !== "GET") {
		return;
	}

	// Skip cross-origin requests
	if (!event.request.url.startsWith(self.location.origin)) {
		return;
	}

	event.respondWith(
		fetch(event.request)
			.then((response) => {
				// Clone the response before caching
				const responseToCache = response.clone();

				caches.open(CACHE_NAME).then((cache) => {
					cache.put(event.request, responseToCache);
				});

				return response;
			})
			.catch(() => {
				// If network fails, try cache
				return caches.match(event.request).then((response) => {
					if (response) {
						return response;
					}

					// Return offline page for navigation requests
					if (event.request.mode === "navigate") {
						return caches.match("/");
					}
				});
			})
	);
});

// Handle push notifications (for future use)
self.addEventListener("push", (event) => {
	const options = {
		body: event.data ? event.data.text() : "New notification",
		icon: "/icons/icon-192x192.png",
		badge: "/icons/icon-72x72.png",
		vibrate: [100, 50, 100],
		data: {
			dateOfArrival: Date.now(),
			primaryKey: 1,
		},
	};

	event.waitUntil(
		self.registration.showNotification("PeopleFlow HR Suite", options)
	);
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	event.waitUntil(
		clients
			.matchAll({ type: "window", includeUncontrolled: true })
			.then((clientList) => {
				// Check if a window is already open
				for (const client of clientList) {
					if (client.url === "/" && "focus" in client) {
						return client.focus();
					}
				}
				// Open a new window
				if (clients.openWindow) {
					return clients.openWindow("/");
				}
			})
	);
});
