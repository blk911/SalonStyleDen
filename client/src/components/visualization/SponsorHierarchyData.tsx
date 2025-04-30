import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Define types for API responses
interface ClientResponse {
  id: number;
  name: string;
  sponsor: string | null;
  sponsorName: string | null;
  sponsorSalonId: number | null;
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
    const maleNames = ['david', 'kevin', 'chris', 'frank', 'robert', 'michael', 'alex'];
    const femaleNames = ['jane', 'mary', 'sally', 'tammy', 'deb', 'laura', 'jennifer', 'carla', 'emily', 'tiffany'];
    
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
        console.log("[SPONSOR-HIERARCHY] Fetching hierarchy data...");
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
        
        console.log("[SPONSOR-HIERARCHY] Loaded data:", {
          clients: clients.length,
          salons: salons.length,
          invitations: invitations.length
        });
        
        // Filter to pending invitations only
        const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
        
        // Build the hierarchy starting with VMB, LTD (ID: 1)
        const vmbLtd = salons.find(s => s.id === 1);
        
        if (!vmbLtd) {
          console.warn('VMB, LTD salon not found in results, creating a placeholder');
          // Create a placeholder for VMB, LTD
          const vmbPlaceholder: SalonResponse = {
            id: 1,
            name: 'VMB, LTD',
            owner_name: 'VMB Admin',
            license_verified: true
          };
          // Add to salons array
          salons.push(vmbPlaceholder);
          return vmbPlaceholder;
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
        pendingInvitations.forEach(inv => {
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
        
        // CRITICAL: Build proper parent-child relationships
        console.log("[SPONSOR-HIERARCHY] Building hierarchy connections...");
        
        // First, let's create a connecting function to keep track of what's connected
        const connectedMembers = new Set<number>();
        
        // Helper function to connect a child to its parent
        const connectToParent = (childId: number, parentId: number) => {
          const childNode = memberMap.get(childId);
          const parentNode = memberMap.get(parentId);
          
          if (!childNode || !parentNode) {
            console.warn(`[SPONSOR-HIERARCHY] Cannot connect child ${childId} to parent ${parentId} - node not found`);
            return false;
          }
          
          parentNode.children.push(childNode);
          connectedMembers.add(childId);
          return true;
        };
        
        // Connect Tiffany's salon to VMB, LTD (ID: 42 → 1)
        const tiffanySalon = salons.find(s => s.name.includes('Tiffany') || s.id === 42);
        if (tiffanySalon) {
          connectToParent(tiffanySalon.id, 1);
          console.log('[SPONSOR-HIERARCHY] Connected Tiffany\'s salon to VMB, LTD (ID: 1)');
        }
        
        // Connect all other salons to VMB, LTD if they aren't connected yet
        salons.forEach(salon => {
          if (salon.id !== 1 && !connectedMembers.has(salon.id)) {
            connectToParent(salon.id, 1);
            console.log(`[SPONSOR-HIERARCHY] Connected salon ${salon.name} (${salon.id}) to VMB, LTD (ID: 1)`);
          }
        });
        
        // Connect clients to their sponsors
        console.log("[SPONSOR-HIERARCHY] Connecting clients to sponsors...");
        clients.forEach(client => {
          if (connectedMembers.has(client.id)) return; // Skip if already connected
          
          // Case 1: Client has a sponsorSalonId (connected to a salon directly)
          if (client.sponsorSalonId && memberMap.has(client.sponsorSalonId)) {
            const connected = connectToParent(client.id, client.sponsorSalonId);
            console.log(`[SPONSOR-HIERARCHY] Connected client ${client.name} (${client.id}) to salon ${client.sponsorSalonId}:`, connected);
            if (connected) return;
          }
          
          // Case 2: If sponsor field contains a name, look for a matching client
          if (client.sponsor) {
            const sponsorClient = clients.find(c => 
              c.name.toLowerCase() === client.sponsor?.toLowerCase()
            );
            
            if (sponsorClient) {
              const connected = connectToParent(client.id, sponsorClient.id);
              console.log(`[SPONSOR-HIERARCHY] Connected client ${client.name} (${client.id}) to client sponsor ${sponsorClient.name} (${sponsorClient.id}):`, connected);
              if (connected) return;
            }
          }
          
          // If we get here, connect to VMB, LTD as default sponsor (ID: 1)
          connectToParent(client.id, 1);
          console.log(`[SPONSOR-HIERARCHY] Connected client ${client.name} (${client.id}) to default sponsor VMB, LTD (ID: 1)`);
        });
        
        // Connect pending invitations
        console.log("[SPONSOR-HIERARCHY] Connecting pending invitations...");
        pendingInvitations.forEach(inv => {
          const invNodeId = -inv.id; // We're using negative IDs for invitations
          
          // Case 1: Invitation has senderId (invitation from a client)
          if (inv.senderId && memberMap.has(inv.senderId)) {
            const connected = connectToParent(invNodeId, inv.senderId);
            console.log(`[SPONSOR-HIERARCHY] Connected invitation ${inv.name} (${inv.id}) to sender ${inv.senderId}:`, connected);
            if (connected) return;
          }
          
          // Case 2: Invitation has salonId (invitation from a salon)
          if (inv.salonId && memberMap.has(inv.salonId)) {
            const connected = connectToParent(invNodeId, inv.salonId);
            console.log(`[SPONSOR-HIERARCHY] Connected invitation ${inv.name} (${inv.id}) to salon ${inv.salonId}:`, connected);
            if (connected) return;
          }
          
          // Case 3: Try to match by sponsor name
          if (inv.sponsor) {
            const sponsorClient = clients.find(c => 
              c.name.toLowerCase() === inv.sponsor?.toLowerCase()
            );
            
            if (sponsorClient) {
              const connected = connectToParent(invNodeId, sponsorClient.id);
              console.log(`[SPONSOR-HIERARCHY] Connected invitation ${inv.name} (${inv.id}) to sponsor by name ${sponsorClient.name} (${sponsorClient.id}):`, connected);
              if (connected) return;
            }
          }
          
          // Default: connect to VMB, LTD (ID: 1)
          connectToParent(invNodeId, 1);
          console.log(`[SPONSOR-HIERARCHY] Connected invitation ${inv.name} (${inv.id}) to default sponsor VMB, LTD (ID: 1)`);
        });
        
        console.log("[SPONSOR-HIERARCHY] Hierarchy built successfully");
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