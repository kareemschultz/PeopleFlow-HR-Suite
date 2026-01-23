import { env } from "@PeopleFlow-HR-Suite/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

// biome-ignore lint/performance/noNamespaceImport: drizzle() requires the full schema object
import * as schema from "./schema";

export const db = drizzle(env.DATABASE_URL, { schema });

// Re-export all schema tables and types for easy import
// biome-ignore lint/performance/noBarrelFile: Package entry point needs to re-export all schemas
export * from "./schema";
