// Fixed version of the button click handler
// Replace lines 1087-1090 with:

onClick={() => {
  // Skip confirmation dialog and go directly to final invitation
  const uniqueId = `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
  setFinalInvitationId(uniqueId);
  setShowFinalInvitationModal(true);
}}

// Replace the second instance around line 1134 with the same code