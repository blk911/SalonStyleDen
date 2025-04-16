import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
  const [firstServiceDate, setFirstServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [salonInfo, setSalonInfo] = useState<{name: string} | null>(null);
  const [recentInvites, setRecentInvites] = useState<ClientInvite[]>([]);

  useEffect(() => {
    if (salonId) {
      fetchSalonInfo();
      fetchSalonInvites();
    }
  }, [salonId]);

  const fetchSalonInfo = async () => {
    if (!salonId) return;
    try {
      const response = await fetch(`/api/salons/${salonId}`);
      if (response.ok) {
        const data = await response.json();
        setSalonInfo({
          name: data.name
        });
      }
    } catch (error) {
      console.error('Failed to fetch salon info:', error);
    }
  };

  const fetchSalonInvites = async () => {
    if (!salonId) return;
    
    try {
      console.log(`Fetching invitations for salon ${salonId}`);
      const response = await fetch(`/api/salons/${salonId}/invitations`);
      if (response.ok) {
        const data = await response.json();
        console.log("Received invitations data:", data);
        setRecentInvites(data);
      } else {
        console.error(`Failed to fetch salon invites, status:`, response.status);
      }
    } catch (error) {
      console.error(`Failed to fetch salon ${salonId} invites:`, error);
    }
  };

  const formatPhoneNumber = (input: string) => {
    const numbers = input.replace(/\D/g, '').slice(0, 10);
    if (numbers.length === 0) return '';
    if (numbers.length < 4) return numbers;
    if (numbers.length < 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        throw new Error('Phone number must be 10 digits');
      }

      // Ensure we have salon info for the sponsor field
      if (!salonInfo?.name) {
        throw new Error('Salon information not available. Please try again.');
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
          salonId,
          firstServiceDate,
          status: 'pending',
          sponsor: salonInfo.name // Add the salon name as the sponsor
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }

      // Get the new invitation and add it to the list
      const newInvite = await response.json();
      setRecentInvites(prev => [newInvite, ...prev]);

      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });

      setName("");
      setPhone("");
      setEmail("");
      setNotes("");
      setFirstServiceDate(new Date().toISOString().split('T')[0]);
      setSelectedServices([]);

    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Send Client Invitation</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Line 1: Name and Phone */}
          <div className="flex gap-4">
            <Input
              placeholder="Client Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="flex-1"
            />
            <Input
              placeholder="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              required
              className="flex-1"
            />
          </div>

          {/* Line 2: Email and Date */}
          <div className="flex gap-4">
            <Input
              placeholder="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Input
              type="date"
              value={firstServiceDate}
              onChange={(e) => setFirstServiceDate(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Line 3: Salon Name (read-only) */}
          <Input
            value={salonInfo?.name || 'Loading salon...'}
            disabled
            className="bg-gray-50"
          />

          {/* Line 4: Notes */}
          <Textarea
            placeholder="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />

          {/* Line 5: Favorite Services */}
          <div className="flex flex-wrap gap-2">
            {DEFAULT_SERVICES.map(service => (
              <Button
                key={service}
                type="button"
                variant={selectedServices.includes(service) ? "default" : "outline"}
                onClick={() => {
                  setSelectedServices(prev => 
                    prev.includes(service) 
                      ? prev.filter(s => s !== service)
                      : [...prev, service]
                  );
                }}
                className={selectedServices.includes(service) ? 'bg-pink-500 hover:bg-pink-600' : ''}
              >
                {service}
              </Button>
            ))}
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-pink-500 hover:bg-pink-600"
          >
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </Button>

          {/* Error Alerts */}
          {phoneExists && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This phone number is already registered
              </AlertDescription>
            </Alert>
          )}
          {emailExists && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This email is already registered
              </AlertDescription>
            </Alert>
          )}
        </form>
      </Card>

      {/* Recent Invitations List */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Recent Client Invitations</h3>
        {recentInvites.length === 0 ? (
          <p className="text-center text-gray-500 my-4">No invitations have been sent yet.</p>
        ) : (
          <ScrollArea className="h-[250px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>First Service</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">{invite.name}</TableCell>
                    <TableCell>{formatPhoneNumber(invite.phone)}</TableCell>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                        {invite.status || 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>{invite.firstServiceDate || 'Not scheduled'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
}