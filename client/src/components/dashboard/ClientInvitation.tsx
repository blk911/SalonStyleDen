import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// Marketing sources when no salon context
const SPONSOR_OPTIONS = [
  "Instagram",
  "Facebook",
  "Google",
  "Referral",
  "Walk-in",
  "Event", 
  "Promotion",
  "Other"
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
    <div className="space-y-8">
      <div className="rounded shadow-sm border border-pink-100 p-4">
        <h3 className="font-medium text-lg mb-4 text-center text-pink-700">Send Client Invitation</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Input
              placeholder="Client Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div className="relative">
              <Input
                placeholder="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => {
                  const input = e.target.value.replace(/\D/g, '');
                  setPhone(formatPhoneNumber(input));
                }}
                required
                className={phoneExists ? 'border-red-500' : ''}
              />
              {phoneExists && (
                <Alert variant="destructive" className="mt-1">
                  <AlertDescription>
                    This phone number is already registered
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <div className="relative">
              <Input
                placeholder="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={emailExists ? 'border-red-500' : ''}
              />
              {emailExists && (
                <Alert variant="destructive" className="mt-1">
                  <AlertDescription>
                    This email is already registered
                  </AlertDescription>
                </Alert>
              )}
            </div>
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
              rows={4}
            />
          </div>
          <div>
            <p className="text-center text-gray-500 mb-2">Select favorite services:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {DEFAULT_SERVICES.map(service => (
                <Button
                  key={service}
                  type="button"
                  variant={selectedServices.includes(service) ? "default" : "outline"}
                  onClick={() => toggleService(service)}
                  className={selectedServices.includes(service) ? 'bg-pink-500 hover:bg-pink-600' : ''}
                >
                  {service}
                </Button>
              ))}
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-pink-500 hover:bg-pink-600 py-6 text-lg"
          >
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </form>
      </div>

      <div className="rounded shadow-sm border border-pink-100 p-4">
        <h3 className="font-medium text-lg mb-4 text-center text-pink-700">Recent Client Invitations</h3>
        
        <div className="grid grid-cols-6 gap-4 font-medium text-pink-700 border-b pb-2 mb-4">
          <div>Name</div>
          <div>Phone</div>
          <div>Email</div>
          <div>Status</div>
          <div>Sponsor</div>
          <div>1st Service</div>
        </div>
        
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {recentInvites.map((invite) => (
            <div 
              key={invite.id}
              className="grid grid-cols-6 gap-4 py-2 border-b border-pink-100"
            >
              <div className="font-medium">{invite.name}</div>
              <div className="text-gray-600">
                {formatPhoneNumber(invite.phone)}
              </div>
              <div className="text-gray-600">
                {invite.email}
              </div>
              <div className="text-pink-600">
                {invite.status || 'pending'}
              </div>
              <div className="text-gray-600">
                {invite.sponsor || '-'}
              </div>
              <div className="text-gray-600">
                {invite.firstServiceDate || '-'}
              </div>
              {invite.favoriteServices?.length > 0 && invite.favoriteServices[0] && (
                <div className="col-span-6 -mt-1">
                  <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs">
                    {invite.favoriteServices[0]}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}