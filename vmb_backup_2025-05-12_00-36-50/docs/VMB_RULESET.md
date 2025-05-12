# VMB Platform: Immutable Rules & Standards

This document defines the core rules and standards that **MUST** be followed when developing for the VMB platform. These are non-negotiable requirements that ensure the platform functions correctly and maintains data integrity.

## Foundational Rules

### 1. Sponsor-Client Relationship (MANDATORY)
- Every client **MUST** have a sponsor in their record
- Default fallback is VMB LTD (if no specific sponsor exists)
- This relationship is permanent and forms the basis of all tracking

**Enforcement:**
```typescript
// [RULE: SponsorClientRelationship] -- DO NOT MODIFY WITHOUT LEAD APPROVAL
// Every client must have a sponsor, defaulting to VMB LTD if none specified
if (!clientData.sponsorSalonId) {
  logger.warn(`Default sponsor used: client ${clientData.name} assigned to VMB LTD`);
  clientData.sponsorSalonId = 1; // VMB LTD ID is 1
}
```

### 2. Unique Invitation/Gift IDs (CRITICAL)
- Every invitation generates an immutable, unique code
- This code links all entities in the relationship
- No generic fallbacks allowed for these IDs
- Database integrity enforced through foreign key constraints

**Enforcement:**
```typescript
// [RULE: UniqueInvitationID] -- DO NOT MODIFY WITHOUT LEAD APPROVAL
// Each invitation must have a unique hash code that persists through its lifecycle
if (!invitationData.hash) {
  invitationData.hash = generateUniqueHash(invitationData);
  Object.defineProperty(invitationData, 'hash', {
    writable: false,
    configurable: false
  });
}
```

### 3. Strict Access Control
- Only directly referenced participants can view their specific invitations
- Only the named recipient can accept/decline an invitation
- No third-party access to any invitation data

**Enforcement:**
```typescript
// [RULE: InvitationAccessControl] -- DO NOT MODIFY WITHOUT LEAD APPROVAL
// Only referenced participants can view/modify invitation
function validateInvitationAccess(invitationId, requestingUserId, requestedAction) {
  const invitation = await getInvitation(invitationId);
  
  // For view operations, check if user is sender or recipient
  if (requestedAction === 'view') {
    return invitation.senderId === requestingUserId || 
           invitation.recipientId === requestingUserId;
  }
  
  // For accept/decline operations, ONLY the recipient can perform them
  if (['accept', 'decline'].includes(requestedAction)) {
    return invitation.recipientId === requestingUserId;
  }
  
  // Log unauthorized access attempts
  logger.warn(`Unauthorized invitation access attempt: ${requestingUserId} tried to ${requestedAction} invitation ${invitationId}`);
  return false;
}
```

### 4. Phone Number Standardization
- Phone numbers must be 10 digits (US format)
- Displayed as (xxx) xxx-xxxx
- Stored as pure digits in database
- Each phone number can be associated with only ONE client

**Enforcement:**
```typescript
// [RULE: PhoneNumberStandard] -- DO NOT MODIFY WITHOUT LEAD APPROVAL
// Phone numbers must be properly formatted and unique per client
function formatPhoneNumber(phone) {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Validate length
  if (digitsOnly.length !== 10) {
    throw new Error('Phone number must be exactly 10 digits');
  }
  
  // Format for display
  return `(${digitsOnly.substring(0, 3)}) ${digitsOnly.substring(3, 6)}-${digitsOnly.substring(6)}`;
}

// When saving to database, only store digits
function normalizePhoneForStorage(phone) {
  return phone.replace(/\D/g, '');
}

// Check uniqueness before client creation
async function isPhoneUnique(phone) {
  const normalizedPhone = normalizePhoneForStorage(phone);
  const existingClient = await findClientByPhone(normalizedPhone);
  return !existingClient;
}
```

## Implementation Requirements

### Database Schema Constraints
- All client records MUST have a non-null sponsorSalonId
- All invitations MUST have a unique hash field
- Phone numbers MUST be stored without formatting characters
- Foreign key constraints MUST be enforced for all relationships

### Code-Level Safeguards
- Guard clauses must be included at the beginning of all functions that handle:
  - Client registration
  - Invitation creation/modification
  - Phone number validation
  - Relationship mapping

### Real-Time Monitoring
- All rule violations must be logged with appropriate context
- Fallback to default rules (e.g., using VMB LTD as sponsor) must be logged
- Periodic database audits must identify:
  - Clients without sponsors
  - Invitations without proper relationships
  - Duplicated phone numbers

## Architecture Standards

### Client Registration Flow
- Must verify phone uniqueness
- Must assign a sponsor (default: VMB LTD)
- Must normalize phone number format
- Must log critical steps

### Invitation Creation Flow
- Must generate unique hash
- Must validate all participants
- Must enforce access control
- Must maintain immutable IDs

### Appointment Confirmation Flow
- Must reference the original invitation
- Must validate participant identity
- Must use consistent terminology (no payment terms)
- Must maintain relationship chain integrity

## Modification History

| Date | Rule | Change | Approved By |
|------|------|--------|-------------|
| 2025-05-09 | Payment Terminology | Removed all references to payments | VMB Team |
| 2025-05-09 | Client Registration | Simplified by removing address popup | VMB Team |
| 2025-05-09 | Login Flow | Added TODO for comprehensive implementation | VMB Team |

---

**This ruleset is the foundation of the VMB platform and MUST be strictly followed to maintain system integrity and functionality.**