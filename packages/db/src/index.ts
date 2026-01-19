import { env } from "@PeopleFlow-HR-Suite/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

export const db = drizzle(env.DATABASE_URL, { schema });

// Re-export all schema tables and types for easy import
export * from "./schema";
