import "dotenv/config";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Fallback to hardcoded URL if environment variable is not set
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_8AErnsUw5TmJ@ep-cold-water-a8gx1s4m-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle({ client: pool, schema });