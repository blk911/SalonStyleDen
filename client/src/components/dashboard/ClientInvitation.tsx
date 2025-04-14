
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_SERVICES = [
  "French Tips",
  "Gel Manicure",
  "Acrylics",
  "Custom Design"
];

export default function ClientInvitation() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          notes,
          favoriteServices: selectedServices
        })
      });

      if (response.ok) {
        toast({
          title: "Invitation sent!",
          description: "Your client will receive the invitation shortly.",
        });
        setName("");
        setPhone("");
        setEmail("");
        setNotes("");
        setSelectedServices([]);
      }
    } catch (error) {
      toast({
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
              onChange={(e) => setPhone(e.target.value)}
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
  );
}
