# VMB Invitation Style Flow - Development Notes

## TEMPORARY DEVELOPMENT BYPASS

**Date: April 17, 2025**

This document outlines the temporary development bypass implemented for testing the registration flow and invitation code validation.

### Current Implementation

1. When a user attempts to register with a phone number that's already in the system (e.g., 5127715877), the validation dialog appears.
2. The dialog now includes an "Enter Promo Code" option for existing clients.
3. Clicking this button opens a promo code entry dialog.
4. For development purposes, any code starting with "VMB-" will be accepted for the test phone number 5127715877.
5. After validation, the user is redirected to the client dashboard.

### Testing Instructions

To test the temporary bypass flow:

1. Attempt to register with phone number: `5127715877`
2. When the validation dialog appears, click "Enter Promo Code"
3. Enter any code starting with "VMB-" (e.g., VMB-TEST-123)
4. You should be redirected to the client dashboard

### Implementation Notes

- The promo code validation is handled in the temporary endpoint: `/api/invitations/validate`
- This is NOT a permanent solution and will be replaced with proper verification
- The PromoCodeDialog component includes a clear development mode notice
- All bypass events are logged for tracking

### Production Implementation (Future)

The final implementation will:

1. Verify invitation codes against actual database records
2. Link clients to their invitation history
3. Apply any promotional benefits associated with the invitation
4. Track invitation usage analytics

This temporary bypass allows development to continue while the complete invitation flow is being implemented.

**IMPORTANT: This bypass should be removed before deployment to production.**