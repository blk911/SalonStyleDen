import { sqliteTable, text, integer, blob, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Basic user schema (common fields for salon and client)
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// [RULE: SponsorClientRelationship] -- DO NOT MODIFY WITHOUT LEAD APPROVAL
// Salon schema with proper constraints to enforce relationships
export const salons = sqliteTable("salons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  socialMedia: text("social_media"), // Stores JSON string of array of {platform, handle}
  type: text("type").notNull().default("salon"),
  address: text("address"), // Street address
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  services: text("services"), // Stores JSON string of array of service objects
  promos: text("promos"), // Stores JSON string of array of promo objects
  schedule: text("schedule"), // Stores JSON string of weekly schedule data
  ownerPhotoUrl: text("owner_photo_url"), // URL to the salon owner's photo
  licenseName: text("license_name"), // Name as it appears on license
  licenseNumber: text("license_number"), // License number
  licenseState: text("license_state"), // State that issued the license
  licenseVerified: integer("license_verified", { mode: 'boolean' }).default(false), // Whether license has been verified
  licenseStatus: text("license_status").default("pending"), // Status: pending, verified, rejected
  licenseVerificationDate: integer("license_verification_date", { mode: 'timestamp' }), // Date license was verified
  licenseRejectionReason: text("license_rejection_reason"), // Reason for license rejection
  metadata: text("metadata"), // Additional metadata as JSON string
  sponsor: text("sponsor").notNull().default("VMB LTD"), // Default sponsor name
  sponsorId: integer("sponsor_id").default(1), // ID of the sponsoring salon, default to VMB LTD (1)
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// [RULE: ClientSchema] -- DO NOT MODIFY WITHOUT LEAD APPROVAL
// Client schema with mandatory relationship to sponsor and phone uniqueness
export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(), // Each phone number can only be associated with ONE client
  email: text("email").default(''),
  isCurrentClient: integer("is_current_client", { mode: 'boolean' }).notNull().default(false),
  acceptedTerms: integer("accepted_terms", { mode: 'boolean' }).default(false), // Track terms & conditions acceptance
  profilePromptShown: integer("profile_prompt_shown", { mode: 'boolean' }).default(false), // Track if profile completion prompt has been shown
  suspended: integer("suspended", { mode: 'boolean' }).notNull().default(false), // Track if client account is suspended
  notes: text("notes"),
  favoriteServices: text("favorite_services"), // Stores JSON string of array of service names
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
  socialMedia: text("social_media"), // Stores JSON string of array of {platform, handle}
  photoUrl: text("photo_url"), // URL to the client's photo
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// [RULE: InvitationSchema] -- DO NOT MODIFY WITHOUT LEAD APPROVAL
// Client Invitations schema with strict unique hash requirement and relationship tracking
export const invitations = sqliteTable("invitations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"), // Email is optional for phone-only invitations
  notes: text("notes"),
  message: text("message"), // Custom message from the sender
  // [RULE: UniqueInvitationID] Explicitly track invitation type for relationship mapping
  type: text("type").notNull().default("client_invitation"), // Type of invitation
  favoriteServices: text("favorite_services"), // Stores JSON string of array of service names
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
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
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
export const styleSelections = sqliteTable("style_selections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull().references(() => clients.id),
  styleId: integer("style_id").notNull(),
  salonId: integer("salon_id").notNull().references(() => salons.id),
  selectedAt: integer("selected_at", { mode: 'timestamp' }).notNull(),
  status: text("status").notNull().default("selected")
});

// Activity Logs schema
export const activityLogs = sqliteTable("activity_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  description: text("description").notNull(),
  details: text("details"), // Additional details about the activity as JSON string
  userId: integer("user_id").references(() => users.id),
  salonId: integer("salon_id").references(() => salons.id),
  clientId: integer("client_id").references(() => clients.id),
  timestamp: integer("timestamp", { mode: 'timestamp' }).notNull()
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
export const gifts = sqliteTable("gifts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // [RULE: SponsorClientRelationship] Every gift must have a sender
  senderId: integer("sender_id").references(() => clients.id), // Can be null for "For Me" gifts
  // Recipient ID if already a client
  recipientId: integer("recipient_id").references(() => clients.id),
  // [RULE: PhoneFormat] Store phone as pure digits for recipient
  recipientPhone: text("recipient_phone"), // For non-client recipients
  recipientName: text("recipient_name"), // For non-client recipients
  recipientEmail: text("recipient_email"), // For non-client recipients
  senderPhone: text("sender_phone"), // For tracking sender
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
  paymentRequired: integer("payment_required", { mode: 'boolean' }).default(false), // true for "FROM ME" gifts
  expiresAt: integer("expires_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  redeemedAt: integer("redeemed_at", { mode: 'timestamp' }),
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

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  giftId: integer("gift_id").references(() => gifts.id, { onDelete: 'cascade' }),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  amount: integer("amount").notNull(),
  currency: text("currency").default("usd"),
  status: text("status").default("pending"), // pending, processing, succeeded, failed, canceled
  custodialStatus: text("custodial_status").default("held"), // held, released, refunded
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  releasedAt: integer("released_at", { mode: 'timestamp' }),
  metadata: text("metadata").default("{}"), // JSON string
});

export const adminCustody = sqliteTable("admin_custody", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  totalFundsHeld: integer("total_funds_held").default(0),
  giftCount: integer("gift_count").default(0),
  lastUpdated: integer("last_updated", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Appointment confirmations table
export const appointmentConfirmations = sqliteTable("appointment_confirmations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  giftId: integer("gift_id").references(() => gifts.id, { onDelete: 'cascade' }),
  salonId: integer("salon_id").references(() => salons.id),
  clientId: integer("client_id").references(() => clients.id),
  appointmentDate: integer("appointment_date", { mode: 'timestamp' }),
  appointmentTime: text("appointment_time"),
  serviceType: text("service_type"),
  confirmedBySalon: integer("confirmed_by_salon", { mode: 'boolean' }).default(false),
  confirmedByClient: integer("confirmed_by_client", { mode: 'boolean' }).default(false),
  salonConfirmedAt: integer("salon_confirmed_at", { mode: 'timestamp' }),
  clientConfirmedAt: integer("client_confirmed_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
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
