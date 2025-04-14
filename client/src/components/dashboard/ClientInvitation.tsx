import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [recentInvites, setRecentInvites] = useState<ClientInvite[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format phone number as user types
  const formatPhoneNumber = (input: string) => {
    const numbers = input.replace(/\D/g, '').slice(0, 10);
    if (numbers.length === 0) return '';
    if (numbers.length < 4) return numbers;
    if (numbers.length < 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  };

  useEffect(() => {
    // Load recent invites when component mounts or when salonId changes
    if (salonId) {
      fetchSalonInvites();
    } else {
      fetchRecentInvites();
    }
  }, [salonId]);

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

    try {
      // Validate phone number
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        throw new Error('Phone number must be 10 digits');
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
    <div className="space-y-4">
      <Card className="rounded shadow-sm border border-pink-100">
        <CardContent className="p-2">
          <h3 className="font-medium text-sm mb-2 text-center text-pink-700">Send Client Invitation</h3>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                placeholder="Client Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-8 text-sm"
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
                className="h-8 text-sm"
              />
              <Input
                placeholder="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-8 text-sm"
              />
            </div>
            <Textarea
              placeholder="Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-16 text-sm"
            />
            <div className="flex flex-wrap justify-center gap-1">
              <p className="w-full text-xs text-center text-gray-500 mb-1">Select favorite services:</p>
              {DEFAULT_SERVICES.map(service => (
                <Button
                  key={service}
                  type="button"
                  size="sm"
                  variant={selectedServices.includes(service) ? "default" : "outline"}
                  onClick={() => toggleService(service)}
                  className={`text-xs ${selectedServices.includes(service) ? 'bg-pink-500 hover:bg-pink-600' : 'border-pink-200 text-pink-700 hover:bg-pink-50'}`}
                >
                  {service}
                </Button>
              ))}
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-pink-500 hover:bg-pink-600"
            >
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded shadow-sm border border-pink-100">
        <CardContent className="p-2">
          <h3 className="font-medium text-sm mb-2 text-center text-pink-700">Recent Client Invitations</h3>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {recentInvites.map((invite) => (
                <div 
                  key={invite.id}
                  className="p-2 bg-pink-50 rounded-md text-sm"
                >
                  <div className="grid grid-cols-6 gap-2">
                    <div className="font-medium truncate">{invite.name}</div>
                    <div className="text-xs text-gray-600">
                      {formatPhoneNumber(invite.phone)}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {invite.email}
                    </div>
                    <div className="text-xs text-pink-600">
                      {invite.status || 'Pending'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {invite.sponsor || '-'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {invite.firstServiceDate ? new Date(invite.firstServiceDate).toLocaleDateString() : '-'}
                    </div>
                  </div>
                  {invite.notes && (
                    <p className="text-xs text-gray-600 mt-1">{invite.notes}</p>
                  )}
                  {invite.favoriteServices?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {invite.favoriteServices.map(service => (
                        <span
                          key={service}
                          className="px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded text-[10px]"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}