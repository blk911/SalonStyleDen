/**
 * Salon Application Constants
 * 
 * This file contains centralized constants used throughout the application
 * to reduce hardcoded values and improve maintainability.
 */

// Default salon information
export const DEFAULT_SALON_NAME = "Tiffany 5280 Nails Studio";
export const DEFAULT_SALON_ID = 2;
export const DEFAULT_OWNER_NAME = "Annie";

// Gift system constants
export const GIFT_STATUSES = {
  PENDING: "pending",
  DELIVERED: "delivered",
  REDEEMED: "redeemed",
  COMPLETED: "completed",
  EXPIRED: "expired",
  CANCELLED: "cancelled"
};

// Default service types
export const DEFAULT_SERVICE_TYPE = "Nail Service";
export const DEFAULT_INVITATION_TYPE = "Salon Invitation";

// Default date string for fallback when no date is provided
export const DEFAULT_DATE_STRING = "2025-05-16";

// Prefixes for generated IDs
export const GIFT_HASH_PREFIX = "VMB-GIFT-";
export const INVITATION_HASH_PREFIX = "VMB-INV-";