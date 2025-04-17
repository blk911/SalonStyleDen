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
  schedule: jsonb("schedule"), // Stores weekly schedule data
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
  sponsor: text("sponsor").default("Ven Me, Baby! LTD"), // Sponsor name with default
  type: text("type").notNull().default("client"),
  address: text("address"), // Street address
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  socialMedia: jsonb("social_media"), // Stores array of {platform, handle}
  photoUrl: text("photo_url"), // URL to the client's photo
  createdAt: timestamp("created_at").defaultNow(),
});

// Client Invitations schema
export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  notes: text("notes"),
  favoriteServices: jsonb("favorite_services"), // Stores array of service names
  salonId: integer("salon_id"), // Reference to salon sending the invitation
  sponsor: text("sponsor"),
  inviteHash: text("invite_hash").unique(), // Unique hash identifier for tracking invitations
  status: text("status").notNull().default("pending"), // pending, accepted, declined
  firstServiceDate: text("first_service_date"), // Date of first service (if scheduled)
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
  invitations: many(invitations),
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

export const invitationsRelations = relations(invitations, ({ one }) => ({
  salon: one(salons, {
    fields: [invitations.salonId],
    references: [salons.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertSalonSchema = createInsertSchema(salons).omit({ id: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true });
export const insertInvitationSchema = createInsertSchema(invitations).omit({ id: true });

// Style Selections schema
export const styleSelections = pgTable("style_selections", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  styleId: integer("style_id").notNull(),
  salonId: integer("salon_id").notNull().references(() => salons.id),
  selectedAt: timestamp("selected_at").notNull(),
  status: text("status").notNull().default("selected")
});

// Activity Logs schema
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  userId: integer("user_id").references(() => users.id),
  salonId: integer("salon_id").references(() => salons.id),
  clientId: integer("client_id").references(() => clients.id),
  timestamp: timestamp("timestamp").notNull()
});

// Add relations for new tables
export const styleSelectionsRelations = relations(styleSelections, ({ one }) => ({
  client: one(clients, {
    fields: [styleSelections.clientId],
    references: [clients.id]
  }),
  salon: one(salons, {
    fields: [styleSelections.salonId],
    references: [salons.id]
  })
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id]
  }),
  salon: one(salons, {
    fields: [activityLogs.salonId],
    references: [salons.id]
  }),
  client: one(clients, {
    fields: [activityLogs.clientId],
    references: [clients.id]
  })
}));

// Insert schemas for new tables
export const insertStyleSelectionSchema = createInsertSchema(styleSelections).omit({ id: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSalon = z.infer<typeof insertSalonSchema>;
export type Salon = typeof salons.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type Invitation = typeof invitations.$inferSelect;

export type InsertStyleSelection = z.infer<typeof insertStyleSelectionSchema>;
export type StyleSelection = typeof styleSelections.$inferSelect;

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;