import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DEFAULT_SERVICES = [
  "French Tips",
  "Gel Manicure", 
  "Acrylics",
  "Custom Design"
];

interface ClientInvitationProps {
  salonId?: number;
}

export default function ClientInvitation({ salonId }: ClientInvitationProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [firstServiceDate, setFirstServiceDate] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [salonInfo, setSalonInfo] = useState<{name: string} | null>(null);

  useEffect(() => {
    if (salonId) {
      fetchSalonInfo();
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
          status: 'pending'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }

      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });

      setName("");
      setPhone("");
      setEmail("");
      setNotes("");
      setFirstServiceDate("");
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
    <Card className="p-4">
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
  );
}