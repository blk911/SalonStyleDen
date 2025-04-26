# Modified Sections for VmbStyleOptions.tsx

## Changes Required:

1. First, add back the showConfirmDialog state for compatibility:
```typescript
// We've removed the confirmation dialog in favor of direct submission
const [showConfirmDialog, setShowConfirmDialog] = useState(false); // Added back for compatibility during migration
const [showFinalInvitationModal, setShowFinalInvitationModal] = useState(false);
```

2. For the two "SEND GIFT" buttons (around lines 1089 and 1135), replace:
```typescript
onClick={() => {
  // Show confirmation dialog
  setShowConfirmDialog(true);
}}
```

With:
```typescript
onClick={() => {
  // Skip confirmation dialog and show final invitation directly
  const uniqueId = `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
  setFinalInvitationId(uniqueId);
  setShowFinalInvitationModal(true);
  
  // Log the send action for tracking
  console.log("[FLOW][VmbStyleOptions] Sending invitation directly", {
    recipientName,
    recipientContact,
    styleId: confirmedStyle?.id,
    styleName: confirmedStyle?.name
  });
}}
```

3. Modify any Dialog components that use showConfirmDialog to use showFinalInvitationModal instead
```typescript
// Find any Dialog components like:
<Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>

// And replace with:
<Dialog open={showFinalInvitationModal} onOpenChange={setShowFinalInvitationModal}>
```

4. If there's a confirmation dialog that needs to be removed or bypassed, make sure the final invitation modal includes all the necessary information and actions.