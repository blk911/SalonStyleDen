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

// Gift data refresh settings for consistent real-time updates
export const GIFT_REFRESH_SETTINGS = {
  STALE_TIME: 15000,         // 15 seconds - how long before data is considered stale
  REFETCH_INTERVAL: 30000,   // 30 seconds - active polling interval
  REFRESH_ON_FOCUS: true,    // Refresh when browser tab gets focus
  REFRESH_ON_MOUNT: true,    // Refresh when component mounts
  CACHE_TIME: 180000         // 3 minutes - how long to keep unused data
};

// Error messages for gift system (centralized for consistency)
export const GIFT_ERROR_MESSAGES = {
  FETCH_FAILED: "Unable to retrieve gift information. Please try again.",
  UPDATE_FAILED: "Failed to update gift status. Please try again.",
  SEND_FAILED: "Could not send gift. Please check your information and try again.",
  REDEEM_FAILED: "Unable to redeem this gift. It may have expired or already been used."
};

// Default service types
export const DEFAULT_SERVICE_TYPE = "Nail Service";
export const DEFAULT_INVITATION_TYPE = "Salon Invitation";

// Default date string for fallback when no date is provided
export const DEFAULT_DATE_STRING = "2025-05-16";

// Prefixes for generated IDs
export const GIFT_HASH_PREFIX = "VMB-GIFT-";
export const INVITATION_HASH_PREFIX = "VMB-INV-";