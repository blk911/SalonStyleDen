import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Define types for API responses
interface ClientResponse {
  id: number;
  name: string;
  sponsor: string | null;
  sponsor_name: string | null;
  sponsor_salon_id: number | null;
  type: 'client';
  // Other fields not needed for visualization
}

interface SalonResponse {
  id: number;
  name: string;
  owner_name: string;
  license_verified: boolean;
  // Other fields not needed for visualization
}

interface InvitationResponse {
  id: number;
  name: string;
  sponsor: string | null;
  status: 'pending' | 'accepted' | 'completed';
  salonId: number | null;
  senderId: number | null;
  // Other fields not needed for visualization
}

// Same SponsorMember type from visualizer
export interface SponsorMember {
  id: number;
  name: string;
  type: 'salon' | 'client';
  gender?: 'male' | 'female' | 'unknown';
  isInvitation?: boolean;
  children: SponsorMember[];
}

// Hook to fetch and build the sponsor hierarchy
export function useSponsorHierarchy() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hierarchyData, setHierarchyData] = useState<SponsorMember | null>(null);
  
  // Gender mapping based on common English names
  // In a real app, this would be stored with the user profile
  const genderGuesser = (name: string): 'male' | 'female' | 'unknown' => {
    const maleNames = ['david', 'kevin', 'chris', 'frank', 'robert', 'michael', 'tiffany', 'alex'];
    const femaleNames = ['jane', 'mary', 'sally', 'tammy', 'deb', 'laura', 'jennifer', 'carla', 'emily'];
    
    const lowerName = name.toLowerCase();
    
    if (maleNames.some(n => lowerName.includes(n))) return 'male';
    if (femaleNames.some(n => lowerName.includes(n))) return 'female';
    
    return 'unknown';
  };
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch clients, salons, and invitations in parallel
        const [clientsResponse, salonsResponse, invitationsResponse] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/salons'),
          fetch('/api/invitations'),
        ]);
        
        if (!clientsResponse.ok || !salonsResponse.ok || !invitationsResponse.ok) {
          throw new Error('Failed to fetch hierarchy data');
        }
        
        const clients: ClientResponse[] = await clientsResponse.json();
        const salons: SalonResponse[] = await salonsResponse.json();
        const invitations: InvitationResponse[] = await invitationsResponse.json();
        
        // Filter to pending invitations only
        const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
        
        // Build the hierarchy starting with VMB, LTD
        const vmbLtd = salons.find(s => s.id === 105);
        
        if (!vmbLtd) {
          throw new Error('VMB, LTD salon not found');
        }
        
        // Create root node for VMB, LTD
        const rootNode: SponsorMember = {
          id: vmbLtd.id,
          name: vmbLtd.name,
          type: 'salon',
          children: [],
        };
        
        // Map of all members by ID for easy access
        const memberMap = new Map<number, SponsorMember>();
        memberMap.set(rootNode.id, rootNode);
        
        // Add all salons to the map
        salons.forEach(salon => {
          if (salon.id !== rootNode.id) { // Skip VMB, LTD as it's already added
            const salonNode: SponsorMember = {
              id: salon.id,
              name: salon.name,
              type: 'salon',
              children: [],
            };
            memberMap.set(salon.id, salonNode);
          }
        });
        
        // Add all clients to the map
        clients.forEach(client => {
          const clientNode: SponsorMember = {
            id: client.id,
            name: client.name,
            type: 'client',
            gender: genderGuesser(client.name),
            children: [],
          };
          memberMap.set(client.id, clientNode);
        });
        
        // Add pending invitations as special nodes
        pendingInvitations.forEach((inv, index) => {
          const invNode: SponsorMember = {
            id: -inv.id, // Negative ID to avoid conflicts with real members
            name: inv.name,
            type: 'client',
            gender: genderGuesser(inv.name),
            isInvitation: true,
            children: [],
          };
          memberMap.set(invNode.id, invNode);
        });
        
        // Build the hierarchy by connecting parents and children
        
        // First, connect salons to VMB, LTD (except VMB itself)
        salons.forEach(salon => {
          if (salon.id !== rootNode.id) {
            const salonNode = memberMap.get(salon.id);
            if (salonNode) {
              rootNode.children.push(salonNode);
            }
          }
        });
        
        // Connect clients to their sponsors
        clients.forEach(client => {
          const clientNode = memberMap.get(client.id);
          if (!clientNode) return;
          
          // For sponsor - first check for explicit sponsor
          if (client.sponsor_salon_id) {
            const salonNode = memberMap.get(client.sponsor_salon_id);
            if (salonNode) {
              salonNode.children.push(clientNode);
            }
          } 
          // If no sponsor salon, look for client sponsor by name
          else if (client.sponsor) {
            // Find potential client sponsor by name
            const sponsorClient = clients.find(c => 
              c.name.toLowerCase() === client.sponsor?.toLowerCase()
            );
            
            if (sponsorClient) {
              const sponsorNode = memberMap.get(sponsorClient.id);
              if (sponsorNode) {
                sponsorNode.children.push(clientNode);
              }
            } else {
              // If no sponsor found, default to VMB, LTD
              rootNode.children.push(clientNode);
            }
          } else {
            // If no sponsor info at all, default to VMB, LTD
            rootNode.children.push(clientNode);
          }
        });
        
        // Connect pending invitations to their senders
        pendingInvitations.forEach(inv => {
          const invNode = memberMap.get(-inv.id); // Negative ID for invitations
          if (!invNode) return;
          
          if (inv.senderId) {
            // Invitation from a client
            const senderNode = memberMap.get(inv.senderId);
            if (senderNode) {
              senderNode.children.push(invNode);
            }
          } else if (inv.salonId) {
            // Invitation from a salon
            const salonNode = memberMap.get(inv.salonId);
            if (salonNode) {
              salonNode.children.push(invNode);
            }
          } else if (inv.sponsor) {
            // Fall back to sponsor name
            const sponsorClient = clients.find(c => 
              c.name.toLowerCase() === inv.sponsor?.toLowerCase()
            );
            
            if (sponsorClient) {
              const sponsorNode = memberMap.get(sponsorClient.id);
              if (sponsorNode) {
                sponsorNode.children.push(invNode);
              }
            }
          }
        });
        
        setHierarchyData(rootNode);
      } catch (err: any) {
        console.error('Error fetching sponsor hierarchy:', err);
        setError(err.message || 'Failed to load sponsor hierarchy');
        toast({
          title: 'Error loading sponsor hierarchy',
          description: err.message || 'An unexpected error occurred',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [toast]);
  
  return { hierarchyData, loading, error };
}