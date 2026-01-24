#!/usr/bin/env bun
// =============================================================================
// PeopleFlow HR Suite Server - Docker Entrypoint
// =============================================================================
// JavaScript entrypoint for distroless containers (no shell available)
//
// Responsibilities:
//   1. Run database migrations before starting server
//   2. Start the bundled server
//   3. Handle graceful shutdown
//
// Note: This file is executed directly by Bun in the ENTRYPOINT
// =============================================================================

import { spawn } from "node:child_process";
import process from "node:process";

console.log("[Entrypoint] Starting PeopleFlow HR Suite Server...");

// =============================================================================
// 1. Run Database Migrations
// =============================================================================
console.log("[Entrypoint] Running database migrations...");

const migrateProcess = spawn("bun", ["run", "/app/migrate.bundled.js"], {
	stdio: "inherit",
	env: process.env,
});

migrateProcess.on("error", (error) => {
	console.error("[Entrypoint] Migration error:", error);
	process.exit(1);
});

migrateProcess.on("exit", (code) => {
	if (code !== 0) {
		console.error(`[Entrypoint] Migration failed with code ${code}`);
		process.exit(1);
	}

	console.log("[Entrypoint] Migrations completed successfully");

	// =============================================================================
	// 2. Start Server
	// =============================================================================
	console.log("[Entrypoint] Starting server...");

	const serverProcess = spawn("bun", ["run", "/app/server.bundled.js"], {
		stdio: "inherit",
		env: process.env,
	});

	serverProcess.on("error", (error) => {
		console.error("[Entrypoint] Server error:", error);
		process.exit(1);
	});

	serverProcess.on("exit", (code) => {
		console.log(`[Entrypoint] Server exited with code ${code}`);
		process.exit(code || 0);
	});

	// =============================================================================
	// 3. Graceful Shutdown
	// =============================================================================
	const shutdown = (signal) => {
		console.log(`[Entrypoint] Received ${signal}, shutting down gracefully...`);
		serverProcess.kill(signal);
	};

	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("SIGINT", () => shutdown("SIGINT"));
});
