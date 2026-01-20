import { eq } from "drizzle-orm";
import {
	db,
	departments,
	employees,
	organizations,
	positions,
	taxJurisdictions,
} from "../index";

async function cleanup() {
	console.log("🧹 Cleaning up all seed data...");

	try {
		// Delete in reverse order of dependencies
		console.log("  - Deleting employees...");
		await db.delete(employees);

		console.log("  - Deleting positions...");
		await db.delete(positions);

		console.log("  - Deleting departments...");
		await db.delete(departments);

		console.log("  - Deleting organizations...");
		await db.delete(organizations);

		console.log("  - Deleting Guyana jurisdiction...");
		const _result = await db
			.delete(taxJurisdictions)
			.where(eq(taxJurisdictions.code, "GY"));

		console.log("✅ All seed data cleaned up successfully");
	} catch (error) {
		console.error("Error during cleanup:", error);
	}

	process.exit(0);
}

cleanup();
