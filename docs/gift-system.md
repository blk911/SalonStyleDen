# VMB Platform Gift System Documentation

## Overview

The Gift System is a core component of the VMB Platform that enables clients to send, receive, and redeem service gifts. The system handles the full lifecycle of gifts from creation to redemption, with proper status tracking and visibility controls.

## Gift Flow Diagram

```
┌────────────┐     ┌────────────┐     ┌───────────┐     ┌────────────┐
│ Gift       │     │ Gift       │     │ Gift      │     │ Gift       │
│ Creation   │────>│ Pending    │────>│ Claimed   │────>│ Redeemed   │
└────────────┘     └────────────┘     └───────────┘     └────────────┘
                          │
                          │
                          v
                    ┌────────────┐
                    │ Gift       │
                    │ Expired    │
                    └────────────┘
```

## Key Components

### 1. Gift Creation

- **Entry Point**: Client dashboard or salon profile
- **Process**:
  - Sender selects recipient and gift type
  - Sender enters recipient details (name, phone, optional email)
  - Sender includes optional message
  - System generates unique gift hash for tracking
- **Backend**: `POST /api/gifts` endpoint
- **Status**: Set to "pending" upon creation
- **Files**:
  - `client/src/components/gifts/GiftCreationForm.tsx`
  - `server/routes.ts` (gift creation endpoint)

### 2. Gift Claiming

- **Entry Point**: Email link or direct hash URL
- **Process**:
  - Recipient views gift details
  - Recipient can claim gift using their phone number
  - On claim, gift status updates to "claimed"
- **Backend**: `POST /api/gifts/:giftHash/claim` endpoint
- **Files**:
  - `client/src/components/gifts/GiftClaimCard.tsx`
  - `client/src/components/gifts/ReceivedGiftsDisplay.tsx`
  - `server/routes.ts` (gift claim endpoint)

### 3. Gift Redemption

- **Entry Point**: Salon dashboard
- **Process**:
  - Salon owner can mark gift as redeemed after service
  - Updates gift status to "redeemed"
- **Backend**: `POST /api/gifts/:giftHash/redeem` endpoint
- **Files**:
  - `client/src/components/dashboard/GiftRedemptionCard.tsx`
  - `server/routes.ts` (gift redemption endpoint)

### 4. Gift Display Components

- **Sent Gifts**: Shows gifts sent by the current client
  - File: `client/src/components/gifts/SentGiftsDisplay.tsx`
- **Received Gifts**: Shows gifts received by the current client
  - File: `client/src/components/gifts/ReceivedGiftsDisplay.tsx`
- **Gift Request Summary**: Shows pending gift requests in admin dashboard
  - File: `client/src/components/dashboard/GiftRequestSummary.tsx`

## Gift Status Lifecycle

1. **pending**: Initial state, gift has been created but not claimed
2. **claimed**: Gift has been claimed by recipient but not yet redeemed
3. **redeemed**: Gift has been used for a service
4. **expired**: Gift has passed its expiration date (if applicable)
5. **cancelled**: Gift was cancelled by sender or admin

## Database Schema

Gifts are stored in the database with the following structure:

```typescript
// From shared/schema.ts
export const gifts = pgTable("gifts", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  recipientId: integer("recipient_id"),
  recipientPhone: text("recipient_phone"),
  recipientEmail: text("recipient_email"),
  giftType: text("gift_type").notNull().default("style_card"),
  styleId: integer("style_id"),
  styleName: text("style_name"),
  amount: integer("amount"),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  salonId: integer("salon_id"),
  giftHash: text("gift_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  redeemedAt: timestamp("redeemed_at", { mode: "date" }),
});
```

## API Endpoints

### Gift Creation
```
POST /api/gifts
Body: {
  senderId: number,
  recipientName: string,
  recipientPhone: string,
  recipientEmail?: string,
  giftType: string,
  styleId?: number,
  styleName?: string,
  amount?: number,
  message?: string,
  salonId?: number
}
Response: {
  id: number,
  giftHash: string,
  status: string,
  ...other gift details
}
```

### Gift Claiming
```
POST /api/gifts/:giftHash/claim
Body: {
  clientId?: number,
  phone: string,
  email?: string,
  status: string
}
Response: {
  success: boolean,
  gift: {
    id: number,
    giftHash: string,
    status: string,
    ...other gift details
  }
}
```

### Gift Redemption
```
POST /api/gifts/:giftHash/redeem
Body: {
  salonId: number
}
Response: {
  success: boolean,
  gift: {
    id: number,
    giftHash: string,
    status: "redeemed",
    redeemedAt: Date,
    ...other gift details
  }
}
```

### Retrieve Sent Gifts
```
GET /api/gifts/sent/:clientId
Response: [
  {
    id: number,
    giftHash: string,
    status: string,
    ...other gift details
  }
]
```

### Retrieve Received Gifts
```
GET /api/gifts/received/:clientId
Response: [
  {
    id: number,
    giftHash: string,
    status: string,
    ...other gift details
  }
]
```

## UI Behavior

### Gift Cards

- Gift cards collapse after delivery, showing "DELIVERED" status
- Toggle functionality allows expanding/collapsing gift details
- Button text dynamically changes based on context ("SEND GIFT TO [client name]")

### Gift Requests in Admin Dashboard

- Admin dashboard shows summary of client gift requests
- Displays sender, recipient, and gift details
- Allows admin to approve, modify, or reject gift requests

## Testing

The gift system can be tested using the component test suite at `scripts/component-test.js`, which validates:

- Gift creation endpoints
- Gift claiming endpoints
- Sent/received gift retrieval 
- Gift status updates

## Debug Support

The system includes the `useGiftDebugger` hook for development-only debugging:

```typescript
// From client/src/hooks/useGiftDebugger.ts
export const useGiftDebugger = (data: any, context: string) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[GIFT-DEBUG][${context}]`, data);
    }
  }, [data, context]);
};
```

## Common Issues & Solutions

### "Failed to send gift" Error

This error typically occurs when:
1. The gift claim endpoint URL pattern doesn't match frontend expectations
2. The recipient phone number format is inconsistent

**Solution**: Ensure phone numbers are consistently formatted and the API endpoint matches the expected pattern.

### Gift Not Appearing in Recipient's Dashboard

This can happen when:
1. The phone number in the client record doesn't match the gift recipient phone
2. The gift's status wasn't properly updated after claiming

**Solution**: Verify phone number matching logic and status updates are working correctly.

### Duplicate Gift Creation

This can occur when:
1. Multiple form submissions happen due to missing submission prevention
2. Network issues cause resubmission of the same gift request

**Solution**: Implement proper form submission controls and idempotent API endpoints.

## Maintenance Guidelines

1. **Phone Number Handling**: 
   - Always use the `cleanPhoneNumber` utility to standardize phone formats
   - Store phone numbers in E.164 format without parentheses or dashes
   - Display phone numbers in (xxx) xxx-xxxx format in the UI

2. **Gift Hash Security**:
   - Always generate cryptographically secure UUIDs for gift hashes
   - Treat gift hashes as sensitive information in logs and error messages

3. **Status Transitions**:
   - Only allow valid status transitions (e.g., pending → claimed → redeemed)
   - Log all status transitions for audit purposes
   - Include status change timestamps for tracking

4. **Error Handling**:
   - Provide specific error messages for different failure scenarios
   - Log all gift-related errors with relevant context
   - Return appropriate HTTP status codes for different error types