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

// [RULE: SponsorClientRelationship] -- DO NOT MODIFY WITHOUT LEAD APPROVAL
// Salon schema with proper constraints to enforce relationships
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
  licenseVerificationDate: timestamp("license_verification_date"), // Date license was verified
  licenseRejectionReason: text("license_rejection_reason"), // Reason for license rejection
  metadata: jsonb("metadata"), // Additional metadata
  sponsor: text("sponsor").notNull().default("VMB LTD"), // Default sponsor name
  sponsorId: integer("sponsor_id").default(1), // ID of the sponsoring salon, default to VMB LTD (1)
  createdAt: timestamp("created_at").defaultNow(),
});

// [RULE: ClientSchema] -- DO NOT MODIFY WITHOUT LEAD APPROVAL
// Client schema with mandatory relationship to sponsor and phone uniqueness
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(), // Each phone number can only be associated with ONE client
  email: text("email").default(''),
  isCurrentClient: boolean("is_current_client").notNull().default(false),
  acceptedTerms: boolean("accepted_terms").default(false), // Track terms & conditions acceptance
  profilePromptShown: boolean("profile_prompt_shown").default(false), // Track if profile completion prompt has been shown
  suspended: boolean("suspended").notNull().default(false), // Track if client account is suspended
  notes: text("notes"),
  favoriteServices: jsonb("favorite_services"), // Stores array of service names
  // [RULE: SponsorClientRelationship] Client salon relationship
  salonId: integer("salon_id").references(() => salons.id), // Reference to salon if client belongs to one
  salonName: text("salon_name"), // Name of the salon for display purposes
  // [RULE: SponsorClientRelationship] CRITICAL: Every client MUST have these sponsor fields
  sponsor: text("sponsor").notNull().default("VMB LTD"), // Sponsor name with default
  sponsorName: text("sponsor_name").notNull().default("VMB LTD"), // Name of the sponsor
  sponsorSalonId: integer("sponsor_salon_id").notNull().default(1).references(() => salons.id), // Default to VMB LTD (ID: 1)
  // [RULE: UniqueInvitationID] CRITICAL: Track the invitation that created this client
  inviteHash: text("invite_hash"), // The hash code from the invitation that created the client
  type: text("type").notNull().default("client"),
  address: text("address"), // Street address
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  socialMedia: jsonb("social_media"), // Stores array of {platform, handle}
  photoUrl: text("photo_url"), // URL to the client's photo
  createdAt: timestamp("created_at").defaultNow(),
});

// [RULE: InvitationSchema] -- DO NOT MODIFY WITHOUT LEAD APPROVAL
// Client Invitations schema with strict unique hash requirement and relationship tracking
export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"), // Email is optional for phone-only invitations
  notes: text("notes"),
  message: text("message"), // Custom message from the sender
  // [RULE: UniqueInvitationID] Explicitly track invitation type for relationship mapping
  type: text("type").notNull().default("client_invitation"), // Type of invitation
  favoriteServices: jsonb("favorite_services"), // Stores array of service names
  // [RULE: SponsorClientRelationship] Critical salon relationship
  salonId: integer("salon_id").notNull().default(1).references(() => salons.id),
  // Reference to the client who sent the invitation (may be null for salon-initiated invitations)
  senderId: integer("sender_id").references(() => clients.id),
  // [RULE: SponsorClientRelationship] Every invitation must have a sponsor
  sponsor: text("sponsor").notNull().default("VMB LTD"),
  sponsorName: text("sponsor_name").notNull().default("VMB LTD"),
  // [RULE: UniqueInvitationID] CRITICAL: Every invitation must have a unique hash
  inviteHash: text("invite_hash").notNull().unique(), // Immutable unique tracking ID
  status: text("status").notNull().default("pending"), // pending, accepted, declined, completed
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
  details: jsonb("details"), // Additional details about the activity
  userId: integer("user_id").references(() => users.id),
  salonId: integer("salon_id").references(() => salons.id),
  clientId: integer("client_id").references(() => clients.id),
  timestamp: timestamp("timestamp").notNull()
});

// Gift-based system - Appointment functionality removed

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

// Appointment relations removed - Gift-based model

// [RULE: GiftSchema] -- DO NOT MODIFY WITHOUT LEAD APPROVAL
// Gifts schema with sponsorship tracking and unique tracking ID
export const gifts = pgTable("gifts", {
  id: serial("id").primaryKey(),
  // [RULE: SponsorClientRelationship] Every gift must have a sender
  senderId: integer("sender_id").notNull().references(() => clients.id),
  // Recipient ID if already a client
  recipientId: integer("recipient_id").references(() => clients.id),
  // [RULE: PhoneFormat] Store phone as pure digits for recipient
  recipientPhone: text("recipient_phone"), // For non-client recipients
  recipientEmail: text("recipient_email"), // For non-client recipients
  // Every gift must have a type
  giftType: text("gift_type").notNull().default("style_card"),
  styleId: integer("style_id"),
  styleName: text("style_name"),
  // Every gift must have an amount
  amount: integer("amount").notNull(), // Amount in cents
  message: text("message"),
  // [RULE: UniqueGiftTracking] Every gift has a mandatory status
  status: text("status").notNull().default("created"), // created, sent, redeemed
  // [RULE: SponsorClientRelationship] Track the salon that created/sponsored this gift
  salonId: integer("salon_id").default(1).references(() => salons.id),
  // [RULE: UniqueGiftTracking] Every gift must have a unique tracking ID 
  giftHash: text("gift_hash").notNull().unique(), // Unique hash for tracking gifts
  paymentStatus: text("payment_status").default("unpaid"), // unpaid, processing, paid, not_required, failed
  appointmentStatus: text("appointment_status").default("not_available"), // not_available, available, requested, confirmed, completed
  paymentIntentId: text("payment_intent_id"), // Stripe payment intent ID
  custodialAmount: integer("custodial_amount").default(0), // Amount held by admin in cents
  paymentRequired: boolean("payment_required").default(false), // true for "FROM ME" gifts
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  redeemedAt: timestamp("redeemed_at"),
});

// [RULE: GiftRelations] -- DO NOT MODIFY WITHOUT LEAD APPROVAL
// Add relations for gifts including salon relationship
export const giftsRelations = relations(gifts, ({ one }) => ({
  sender: one(clients, {
    fields: [gifts.senderId],
    references: [clients.id]
  }),
  recipient: one(clients, {
    fields: [gifts.recipientId],
    references: [clients.id]
  }),
  // [RULE: SponsorClientRelationship] Every gift must be associated with a salon
  salon: one(salons, {
    fields: [gifts.salonId],
    references: [salons.id]
  })
}));

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  giftId: integer("gift_id").references(() => gifts.id, { onDelete: 'cascade' }),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  amount: integer("amount").notNull(),
  currency: text("currency").default("usd"),
  status: text("status").default("pending"), // pending, processing, succeeded, failed, canceled
  custodialStatus: text("custodial_status").default("held"), // held, released, refunded
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  releasedAt: timestamp("released_at"),
  metadata: jsonb("metadata").default({}),
});

export const adminCustody = pgTable("admin_custody", {
  id: serial("id").primaryKey(),
  totalFundsHeld: integer("total_funds_held").default(0),
  giftCount: integer("gift_count").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Appointment confirmations table
export const appointmentConfirmations = pgTable("appointment_confirmations", {
  id: serial("id").primaryKey(),
  giftId: integer("gift_id").references(() => gifts.id, { onDelete: 'cascade' }),
  salonId: integer("salon_id").references(() => salons.id),
  clientId: integer("client_id").references(() => clients.id),
  appointmentDate: timestamp("appointment_date"),
  appointmentTime: text("appointment_time"),
  serviceType: text("service_type"),
  confirmedBySalon: boolean("confirmed_by_salon").default(false),
  confirmedByClient: boolean("confirmed_by_client").default(false),
  salonConfirmedAt: timestamp("salon_confirmed_at"),
  clientConfirmedAt: timestamp("client_confirmed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  notes: text("notes"),
});

// Insert schemas for new tables
export const insertStyleSelectionSchema = createInsertSchema(styleSelections).omit({ id: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true });
// Appointment schema removed - Gift-based model
export const insertGiftSchema = createInsertSchema(gifts).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true });
export const insertAdminCustodySchema = createInsertSchema(adminCustody).omit({ id: true });
export const insertAppointmentConfirmationSchema = createInsertSchema(appointmentConfirmations).omit({ id: true });

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

// Appointment types removed - Gift-based model

export type InsertGift = z.infer<typeof insertGiftSchema>;
export type Gift = typeof gifts.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertAdminCustody = z.infer<typeof insertAdminCustodySchema>;
export type AdminCustody = typeof adminCustody.$inferSelect;

export type InsertAppointmentConfirmation = z.infer<typeof insertAppointmentConfirmationSchema>;
export type AppointmentConfirmation = typeof appointmentConfirmations.$inferSelect;
