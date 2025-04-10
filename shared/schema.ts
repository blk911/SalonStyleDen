import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Basic user schema (common fields for salon and client)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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
  address: text("address"), // Street address
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  services: jsonb("services"), // Stores array of service objects
  promos: jsonb("promos"), // Stores array of promo objects
  ownerPhotoUrl: text("owner_photo_url"), // URL to the salon owner's photo
  createdAt: timestamp("created_at").defaultNow(),
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
  salonId: integer("salon_id"), // Reference to salon if client belongs to one
  salonName: text("salon_name"), // Name of the salon for display purposes
  type: text("type").notNull().default("client"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  salons: many(salons),
  clients: many(clients),
}));

export const salonsRelations = relations(salons, ({ one, many }) => ({
  user: one(users, {
    fields: [salons.id],
    references: [users.id],
  }),
  clients: many(clients),
}));

export const clientsRelations = relations(clients, ({ one }) => ({
  user: one(users, {
    fields: [clients.id],
    references: [users.id],
  }),
  salon: one(salons, {
    fields: [clients.salonId],
    references: [salons.id],
  }),
}));

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
