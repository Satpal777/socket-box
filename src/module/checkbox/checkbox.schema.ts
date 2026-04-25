import { Check } from "drizzle-orm/mysql-core";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const checkboxes = pgTable("checkboxes", {
  id: text("id").primaryKey(),
  checked: integer("checked").notNull().default(0),
  updatedBy: text("updated_by"),  // Store user ID, avatar generated from this
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Checkbox = typeof checkboxes.$inferSelect;