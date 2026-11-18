import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "../src/lib/db";

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migraciones aplicadas.");
