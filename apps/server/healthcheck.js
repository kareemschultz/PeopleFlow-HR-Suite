#!/usr/bin/env bun
// =============================================================================
// PeopleFlow HR Suite Server - Health Check
// =============================================================================
// Health check script for Docker HEALTHCHECK directive
//
// This file is executed in exec-form (no shell) for distroless compatibility
// Returns exit code 0 for healthy, 1 for unhealthy
//
// Note: Uses HTTP GET request to /health endpoint
// =============================================================================

const HEALTH_URL = `http://localhost:${process.env.PORT || 3000}/health`;
const TIMEOUT_MS = 5000;

try {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

	const response = await fetch(HEALTH_URL, {
		method: "GET",
		signal: controller.signal,
	});

	clearTimeout(timeoutId);

	if (response.ok) {
		console.log("[Health Check] OK");
		process.exit(0);
	}

	console.error(`[Health Check] Failed: HTTP ${response.status}`);
	process.exit(1);
} catch (error) {
	console.error(`[Health Check] Error: ${error.message}`);
	process.exit(1);
}
