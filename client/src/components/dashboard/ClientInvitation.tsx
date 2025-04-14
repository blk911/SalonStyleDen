
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
}

export default function ClientInvitation() {
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
    // Load recent invites when component mounts
    fetchRecentInvites();
  }, []);

  const fetchRecentInvites = async () => {
    try {
      const response = await fetch('/api/invitations/recent');
      if (response.ok) {
        const data = await response.json();
        setRecentInvites(data);
      }
    } catch (error) {
      console.error('Failed to fetch recent invites:', error);
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
          createdAt: new Date().toISOString()
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
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive"
      });
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
      <Card className="rounded shadow-sm">
        <CardContent className="p-2">
          <h3 className="font-medium text-sm mb-2">Client Invitations</h3>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Client Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-8 text-sm flex-1"
              />
              <Input
                placeholder="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => {
                  const input = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhone(input);
                }}
                required
                className="h-8 text-sm flex-1"
              />
              <Input
                placeholder="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-8 text-sm flex-1"
              />
            </div>
            <Textarea
              placeholder="Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-20"
            />
            <div className="flex flex-wrap gap-1">
              {DEFAULT_SERVICES.map(service => (
                <Button
                  key={service}
                  type="button"
                  size="sm"
                  variant={selectedServices.includes(service) ? "default" : "outline"}
                  onClick={() => toggleService(service)}
                  className="text-xs"
                >
                  {service}
                </Button>
              ))}
            </div>
            <Button type="submit" className="w-full bg-pink-500 hover:bg-pink-600">
              Send Invitation
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded shadow-sm">
        <CardContent className="p-2">
          <h3 className="font-medium text-sm mb-2">Recent Client Invitations</h3>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {recentInvites.map((invite) => (
                <div 
                  key={invite.id}
                  className="p-2 bg-pink-50 rounded-md text-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{invite.name}</p>
                      <p className="text-xs text-gray-500">{invite.phone} • {invite.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(invite.createdAt).toLocaleDateString()}
                    </span>
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
