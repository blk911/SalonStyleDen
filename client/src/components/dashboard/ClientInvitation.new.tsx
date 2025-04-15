import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription
} from "@/components/ui/alert";

const DEFAULT_SERVICES = [
  "French Tips",
  "Gel Manicure",
  "Acrylics",
  "Custom Design"
];

interface ClientInvite {
  id: number;
  name: string;
  phone: string;
  email: string;
  notes?: string;
  favoriteServices: string[];
  createdAt: string;
  salonId?: number;
  status?: string;
  sponsor?: string;
  firstServiceDate?: string;
}

interface ClientInvitationProps {
  salonId?: number;
}

export default function ClientInvitation({ salonId }: ClientInvitationProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [sponsor, setSponsor] = useState("");
  const [firstServiceDate, setFirstServiceDate] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [recentInvites, setRecentInvites] = useState<ClientInvite[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [salonInfo, setSalonInfo] = useState<{name: string, ownerName: string} | null>(null);

  // Format phone number as user types
  const formatPhoneNumber = (input: string) => {
    const numbers = input.replace(/\D/g, '').slice(0, 10);
    if (numbers.length === 0) return '';
    if (numbers.length < 4) return numbers;
    if (numbers.length < 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  };
  
  // Check if phone or email exists
  const checkExistingContact = async (field: 'phone' | 'email', value: string) => {
    if (!value) return false;
    
    try {
      // Simple validation check
      if (field === 'phone' && value.replace(/\D/g, '').length !== 10) return false;
      if (field === 'email' && !value.includes('@')) return false;
      
      const response = await fetch(`/api/clients/check?${field}=${encodeURIComponent(value)}`);
      if (response.ok) {
        const data = await response.json();
        if (field === 'phone') {
          setPhoneExists(data.exists);
          return data.exists;
        } else {
          setEmailExists(data.exists);
          return data.exists;
        }
      }
    } catch (error) {
      console.error(`Error checking ${field}:`, error);
    }
    return false;
  };

  useEffect(() => {
    // Load recent invites when component mounts or when salonId changes
    if (salonId) {
      fetchSalonInvites();
      fetchSalonInfo();
    } else {
      fetchRecentInvites();
    }
  }, [salonId]);
  
  // Fetch salon information for the sponsor
  const fetchSalonInfo = async () => {
    if (!salonId) return;
    
    try {
      const response = await fetch(`/api/salons/${salonId}`);
      if (response.ok) {
        const data = await response.json();
        setSalonInfo({
          name: data.name,
          ownerName: data.ownerName
        });
        
        // If in salon context, automatically set the sponsor field to salon name 
        setSponsor(data.name);
      }
    } catch (error) {
      console.error('Failed to fetch salon info:', error);
    }
  };
  
  // Verify phone number when it changes
  useEffect(() => {
    if (phone.length === 12) { // Format: XXX-XXX-XXXX (12 chars)
      const timer = setTimeout(() => {
        checkExistingContact('phone', phone.replace(/\D/g, ''));
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setPhoneExists(false);
    }
  }, [phone]);
  
  // Verify email when it changes
  useEffect(() => {
    if (email.includes('@') && email.includes('.')) {
      const timer = setTimeout(() => {
        checkExistingContact('email', email);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setEmailExists(false);
    }
  }, [email]);

  const fetchRecentInvites = async () => {
    try {
      console.log('Fetching recent invitations');
      const response = await fetch('/api/invitations?limit=10');
      if (response.ok) {
        const data = await response.json();
        setRecentInvites(data);
      } else {
        console.error('Failed to fetch recent invites, status:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch recent invites:', error);
    }
  };
  
  const fetchSalonInvites = async () => {
    if (!salonId) return;
    
    try {
      console.log(`Fetching invitations for salon ${salonId}`);
      const response = await fetch(`/api/salons/${salonId}/invitations`);
      if (response.ok) {
        const data = await response.json();
        setRecentInvites(data);
      } else {
        console.error(`Failed to fetch salon invites, status:`, response.status);
      }
    } catch (error) {
      console.error(`Failed to fetch salon ${salonId} invites:`, error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Check if phone or email already exists
    if (phoneExists || emailExists) {
      toast({
        title: "Error",
        description: phoneExists ? "Phone number already registered" : "Email already registered",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Validate phone number
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        throw new Error('Phone number must be 10 digits');
      }

      // Always use the salon name as the sponsor when sending from salon dashboard
      const sponsorToUse = salonId ? salonInfo?.name : sponsor;
      
      if (salonId && !sponsorToUse) {
        throw new Error('Sponsor information is required. Please try again.');
      }
      
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone: cleanPhone,
          email,
          notes,
          favoriteServices: selectedServices,
          salonId: salonId || undefined,
          sponsor: sponsorToUse || undefined,
          // Always send first service as "Pending"
          firstServiceDate: "Pending",
          status: 'pending'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }

      const newInvite = await response.json();
      setRecentInvites(prev => [newInvite, ...prev]);
      
      toast({
        title: "Invitation sent!",
        description: "Your client will receive the invitation shortly.",
      });
      
      setName("");
      setPhone("");
      setEmail("");
      setNotes("");
      setSponsor("");
      setFirstServiceDate("");
      setSelectedServices([]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to send invitation. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  return (
    <div>
      <div>
        <h3>Send Client Invitation</h3>
        <form onSubmit={handleSubmit}>
          <Input
            placeholder="Client Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            placeholder="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => {
              const input = e.target.value.replace(/\D/g, '');
              setPhone(formatPhoneNumber(input));
            }}
            required
          />
          {phoneExists && (
            <Alert variant="destructive">
              <AlertDescription>
                This phone number is already registered
              </AlertDescription>
            </Alert>
          )}
          <Input
            placeholder="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {emailExists && (
            <Alert variant="destructive">
              <AlertDescription>
                This email is already registered
              </AlertDescription>
            </Alert>
          )}
          <Input
            placeholder="Sponsor (Optional)"
            value={sponsor}
            onChange={(e) => setSponsor(e.target.value)}
          />
          <Input
            type="date"
            placeholder="mm/dd/yyyy"
            value={firstServiceDate}
            onChange={(e) => setFirstServiceDate(e.target.value)}
          />
          <Textarea
            placeholder="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <p>Select favorite services:</p>
          <div>
            {DEFAULT_SERVICES.map(service => (
              <Button
                key={service}
                type="button"
                variant={selectedServices.includes(service) ? "default" : "outline"}
                onClick={() => toggleService(service)}
              >
                {service}
              </Button>
            ))}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </form>
      </div>

      <div>
        <h3>Recent Client Invitations</h3>
        <div>
          <div>Name</div>
          <div>Phone</div>
          <div>Email</div>
          <div>Status</div>
          <div>Sponsor</div>
          <div>1st Service</div>
        </div>
        <div>
          {recentInvites.map((invite) => (
            <div key={invite.id}>
              <div>{invite.name}</div>
              <div>{formatPhoneNumber(invite.phone)}</div>
              <div>{invite.email}</div>
              <div>{invite.status || 'Pending'}</div>
              <div>{invite.sponsor || '-'}</div>
              <div>{invite.firstServiceDate || '-'}</div>
              {invite.favoriteServices?.length > 0 && (
                <div>
                  {invite.favoriteServices.map(service => (
                    <span key={service}>{service}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}