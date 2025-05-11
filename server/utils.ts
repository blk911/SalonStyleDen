/**
 * Server-side utility functions for handling phone numbers, standardized across the application
 * 
 * [RULE: PhoneNumberStandard] -- DO NOT MODIFY WITHOUT LEAD APPROVAL
 * These functions implement VMB's phone number handling standard:
 * 1. All phone numbers must be stored as 10 digits without formatting
 * 2. All phone numbers must be displayed as (xxx) xxx-xxxx
 * 3. Each phone number can be associated with only ONE client
 */

/**
 * SERVER-WIDE STANDARD: Remove all non-digit characters from a phone number
 * @param phoneNumber The phone number to clean
 * @returns Only the digits of the phone number
 */
export function cleanPhoneNumber(phoneNumber: string | null | undefined): string {
  if (!phoneNumber) return '';
  return phoneNumber.replace(/\D/g, '');
}

/**
 * SERVER-WIDE STANDARD: Format a phone number for display as (xxx) xxx-xxxx
 * @param phoneNumber The phone number to format
 * @returns Formatted phone number, or empty string if invalid
 */
export function formatPhoneForDisplay(phoneNumber: string | null | undefined): string {
  const digits = cleanPhoneNumber(phoneNumber);
  
  // Validate to make sure we have enough digits
  if (digits.length < 10) return digits; // Return as-is if not enough digits
  
  // Format as (xxx) xxx-xxxx
  return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6, 10)}`;
}

/**
 * SERVER-WIDE STANDARD: Validate a phone number has exactly 10 digits (US format)
 * @param phone The phone number to validate
 * @returns True if the phone number has exactly 10 digits
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  const digits = cleanPhoneNumber(phone);
  return digits.length === 10;
}

/**
 * SERVER-WIDE STANDARD: Format a phone number for database storage
 * Ensures consistency by storing only the 10 digits
 * @param phone The phone number to normalize
 * @returns Normalized 10-digit phone number for storage
 */
export function normalizePhoneForStorage(phone: string | null | undefined): string {
  return cleanPhoneNumber(phone).slice(0, 10);
}

/**
 * SERVER-WIDE STANDARD: Check if two phone numbers match
 * Compares only the digits, ignoring formatting differences
 * @param phone1 First phone number
 * @param phone2 Second phone number
 * @returns True if the phone numbers match (digit-wise)
 */
export function phonesMatch(phone1: string | null | undefined, phone2: string | null | undefined): boolean {
  const clean1 = cleanPhoneNumber(phone1);
  const clean2 = cleanPhoneNumber(phone2);
  
  if (clean1.length === 0 || clean2.length === 0) {
    return false;
  }
  
  return clean1 === clean2;
}

/**
 * SERVER-WIDE STANDARD: Check if phone number ends with specified digits
 * Useful for partial phone number matching (e.g., last 4 digits)
 * @param phone The full phone number
 * @param lastDigits The last N digits to check for
 * @returns True if the phone number ends with the specified digits
 */
export function phoneEndsWithDigits(phone: string | null | undefined, lastDigits: string): boolean {
  const cleanPhone = cleanPhoneNumber(phone);
  const cleanLastDigits = cleanPhoneNumber(lastDigits);
  
  if (cleanPhone.length < cleanLastDigits.length) {
    return false;
  }
  
  return cleanPhone.slice(-cleanLastDigits.length) === cleanLastDigits;
}