import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Basic user schema (common fields for salon and client)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Salon schema
export const salons = pgTable("salons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  socialMedia: jsonb("social_media"), // Stores array of {platform, handle}
  type: text("type").notNull().default("salon"),
});

// Client schema
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  isCurrentClient: boolean("is_current_client").notNull().default(false),
  notes: text("notes"),
  favoriteServices: jsonb("favorite_services"), // Stores array of service names
  type: text("type").notNull().default("client"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertSalonSchema = createInsertSchema(salons).omit({ id: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSalon = z.infer<typeof insertSalonSchema>;
export type Salon = typeof salons.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
