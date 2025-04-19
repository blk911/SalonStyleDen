import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AtSignIcon, PhoneIcon, SendIcon, UserIcon } from "lucide-react";

interface ClientInviteFormProps {
  clientId: number;
  onSuccess?: () => void;
}

export default function ClientInviteForm({ clientId, onSuccess }: ClientInviteFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "Hey! I love my salon's Ven Me, Baby! style options. You should check them out!",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!form.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your friend's name",
        variant: "destructive",
      });
      return;
    }
    
    if (!form.phone.trim() && !form.email.trim()) {
      toast({
        title: "Contact info required",
        description: "Please enter either phone or email",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Send invitation
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          message: form.message,
          senderId: clientId,
          type: "client_invitation",
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send invitation");
      }
      
      // Get response data
      const data = await response.json();
      
      // Success!
      toast({
        title: "Invitation sent!",
        description: "Your friend will receive an invitation soon",
      });
      
      // Reset form
      setForm({
        name: "",
        phone: "",
        email: "",
        message: "Hey! I love my salon's Ven Me, Baby! style options. You should check them out!",
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-2">
        <Label htmlFor="name" className="text-xs font-medium">
          Friend's Name
        </Label>
        <div className="relative">
          <UserIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            id="name"
            name="name"
            placeholder="Enter your friend's name"
            value={form.name}
            onChange={handleChange}
            className="pl-8"
          />
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="phone" className="text-xs font-medium">
          Friend's Phone
        </Label>
        <div className="relative">
          <PhoneIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            id="phone"
            name="phone"
            placeholder="Enter your friend's phone number"
            value={form.phone}
            onChange={handleChange}
            className="pl-8"
          />
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="email" className="text-xs font-medium">
          Friend's Email
        </Label>
        <div className="relative">
          <AtSignIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            name="email"
            placeholder="Enter your friend's email"
            value={form.email}
            onChange={handleChange}
            className="pl-8"
          />
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="message" className="text-xs font-medium">
          Message (Optional)
        </Label>
        <Input
          id="message"
          name="message"
          placeholder="Add a personal message"
          value={form.message}
          onChange={handleChange}
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={loading}
        className="w-full bg-pink-500 hover:bg-pink-600"
      >
        {loading ? (
          "Sending..."
        ) : (
          <>
            <SendIcon className="h-4 w-4 mr-2" />
            Send Invitation
          </>
        )}
      </Button>
    </form>
  );
}