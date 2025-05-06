// Utility for looking up clients through multiple methods

/**
 * Attempts to find a client ID using multiple lookup methods in sequence
 * 1. First tries by invitation ID
 * 2. Then tries by phone number (cleaned)
 * 3. Finally tries by name
 * 
 * @param invitationId The invitation ID to lookup
 * @param phone The phone number to lookup (will be cleaned of non-digits)
 * @param name The name to lookup
 * @param onSuccess Callback when client is found with the client ID
 * @param onError Callback when no client is found through any method
 * @param showToast Function to show toast notifications (we pass this from the component)
 */
export const findClientId = async (
  invitationId: number,
  phone: string,
  name: string,
  onSuccess: (clientId: number) => void,
  onError: () => void,
  showToast: (message: { title: string; description: string; variant: "default" | "destructive" }) => void
) => {
  try {
    // First try by invitation ID
    console.log(`Looking up client by invitation ID: ${invitationId}`);
    const inviteRes = await fetch(`/api/clients/by-invitation/${invitationId}`);
    
    if (inviteRes.ok) {
      const client = await inviteRes.json();
      console.log(`Found client ID: ${client.id} for invitation: ${invitationId}`);
      onSuccess(client.id);
      return;
    }
    
    // Next try by phone number
    console.log(`No client found by invitation ID, trying by phone: ${phone}`);
    const cleanPhone = phone.replace(/\D/g, '');
    
    const phoneRes = await fetch(`/api/clients/by-phone/${cleanPhone}`);
    
    if (phoneRes.ok) {
      const client = await phoneRes.json();
      console.log(`Found client by phone: ${client.id}`);
      onSuccess(client.id);
      return;
    }
    
    // Last resort - try by name
    console.log(`No client found by phone, trying by name: ${name}`);
    
    const nameRes = await fetch(`/api/clients/by-name/${encodeURIComponent(name)}`);
    
    if (nameRes.ok) {
      const client = await nameRes.json();
      console.log(`Found client by name: ${client.id}`);
      onSuccess(client.id);
      return;
    }
    
    // If we got here, no client was found
    console.error("No client found for this invitation via any method.");
    showToast({
      title: "Client not found",
      description: "Cannot locate this client's dashboard.",
      variant: "destructive"
    });
    onError();
  } catch (err) {
    console.error("Error finding client:", err);
    showToast({
      title: "Error",
      description: "An error occurred while looking up the client.",
      variant: "destructive"
    });
    onError();
  }
};