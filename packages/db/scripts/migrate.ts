/**
 * PeopleFlow HR Suite - Database Migration Script
 *
 * Runs pending Drizzle migrations against the database.
 * This script is designed to be run:
 * - On server startup in production (via Docker entrypoint)
 * - Manually during development/deployment
 *
 * Usage: bun run packages/db/scripts/migrate.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	console.error("❌ DATABASE_URL environment variable is required");
	process.exit(1);
}

async function runMigrations() {
	console.log("🔄 Starting database migrations...");

	// Create postgres client for migrations
	const client = postgres(DATABASE_URL, { max: 1 });

	try {
		console.log("✅ Connected to database");

		// Create drizzle instance
		const db = drizzle(client);

		console.log("🚀 Running pending migrations...");
		await migrate(db, {
			migrationsFolder: "./packages/db/src/migrations",
		});

		console.log("✅ All migrations completed successfully");
	} catch (error) {
		console.error("❌ Migration failed:", error);
		process.exit(1);
	} finally {
		await client.end();
	}
}

runMigrations();
