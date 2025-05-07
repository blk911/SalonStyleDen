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
  licenseName: text("license_name"), // Name as it appears on license
  licenseNumber: text("license_number"), // License number
  licenseState: text("license_state"), // State that issued the license
  licenseVerified: boolean("license_verified").default(false), // Whether license has been verified
  licenseStatus: text("license_status").default("pending"), // Status: pending, verified, rejected
  sponsor: text("sponsor").default("VMB LTD"), // Default sponsor name
  sponsorId: integer("sponsor_id"), // ID of the sponsoring salon
  createdAt: timestamp("created_at").defaultNow(),
});

// Client schema
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").default(''),
  isCurrentClient: boolean("is_current_client").notNull().default(false),
  acceptedTerms: boolean("accepted_terms").default(false), // Track terms & conditions acceptance
  profilePromptShown: boolean("profile_prompt_shown").default(false), // Track if profile completion prompt has been shown
  notes: text("notes"),
  favoriteServices: jsonb("favorite_services"), // Stores array of service names
  salonId: integer("salon_id"), // Reference to salon if client belongs to one
  salonName: text("salon_name"), // Name of the salon for display purposes
  sponsor: text("sponsor").default("VMB LTD"), // Sponsor name with default
  sponsorName: text("sponsor_name"), // Name of the sponsor (client who invited)
  sponsorSalonId: integer("sponsor_salon_id"), // Reference to the salon that sponsored this client
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
  email: text("email"), // Email is optional for phone-only invitations
  notes: text("notes"),
  message: text("message"), // Custom message from the sender
  type: text("type"), // Type of invitation (e.g., "client_invitation")
  favoriteServices: jsonb("favorite_services"), // Stores array of service names
  salonId: integer("salon_id"), // Reference to salon sending the invitation
  senderId: integer("sender_id"), // Reference to the client who sent the invitation
  sponsor: text("sponsor").default("VMB LTD"),
  sponsorName: text("sponsor_name"), // Name of the sponsor (client or salon who invited)
  inviteHash: text("invite_hash").unique(), // Unique hash identifier for tracking invitations
  status: text("status").notNull().default("pending"), // pending, accepted, declined
  firstServiceDate: text("first_service_date"), // Date of first service (if scheduled)
  styleOption: text("style_option"), // Selected style name/option
  stylePrice: integer("style_price"), // Price of the selected style in cents
  styleDuration: integer("style_duration"), // Duration of the style service in minutes
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
  sponsorSalon: one(salons, {
    fields: [clients.sponsorSalonId],
    references: [salons.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  salon: one(salons, {
    fields: [invitations.salonId],
    references: [salons.id],
  }),
  sender: one(clients, {
    fields: [invitations.senderId],
    references: [clients.id],
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

// Appointments schema
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  salonId: integer("salon_id").notNull().references(() => salons.id),
  invitationId: integer("invitation_id").references(() => invitations.id),
  serviceDate: text("service_date").notNull(),
  serviceTime: text("service_time").notNull(),
  status: text("status").notNull().default("confirmed"), // confirmed, cancelled, completed
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
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

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  client: one(clients, {
    fields: [appointments.clientId],
    references: [clients.id]
  }),
  salon: one(salons, {
    fields: [appointments.salonId],
    references: [salons.id]
  }),
  invitation: one(invitations, {
    fields: [appointments.invitationId],
    references: [invitations.id]
  })
}));

// Gifts schema
export const gifts = pgTable("gifts", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => clients.id),
  recipientId: integer("recipient_id").references(() => clients.id),
  recipientPhone: text("recipient_phone"),
  recipientEmail: text("recipient_email"),
  giftType: text("gift_type").notNull().default("style_card"),
  styleId: integer("style_id"),
  styleName: text("style_name"),
  amount: integer("amount").notNull(), // Amount in cents
  message: text("message"),
  status: text("status").notNull().default("created"), // created, sent, redeemed
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  redeemedAt: timestamp("redeemed_at"),
});

// Add relations for gifts
export const giftsRelations = relations(gifts, ({ one }) => ({
  sender: one(clients, {
    fields: [gifts.senderId],
    references: [clients.id]
  }),
  recipient: one(clients, {
    fields: [gifts.recipientId],
    references: [clients.id]
  })
}));

// Insert schemas for new tables
export const insertStyleSelectionSchema = createInsertSchema(styleSelections).omit({ id: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true });
export const insertGiftSchema = createInsertSchema(gifts).omit({ id: true });

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

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export type InsertGift = z.infer<typeof insertGiftSchema>;
export type Gift = typeof gifts.$inferSelect;