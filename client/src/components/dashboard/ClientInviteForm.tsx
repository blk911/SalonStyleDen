import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AtSignIcon, ChevronDownIcon, ChevronUpIcon, PhoneIcon, SendIcon, UserIcon } from "lucide-react";

interface ClientInviteFormProps {
  clientId: number;
  hideLabels?: boolean;
  onSuccess?: () => void;
  hideToggle?: boolean;
}

export default function ClientInviteForm({ clientId, hideLabels = false, onSuccess, hideToggle = false }: ClientInviteFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
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
      
      // Context-aware validation first
      console.log("Performing context-aware validation...");
      const validationResponse = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _validateOnly: true,
          name: form.name,
          phone: form.phone,
          email: form.email,
          senderId: clientId,
        }),
      });
      
      // Handle validation errors
      if (!validationResponse.ok) {
        const errorData = await validationResponse.json();
        toast({
          title: "Validation failed",
          description: errorData.error || "Unable to validate contact information",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      console.log("Validation passed, sending invitation...");
      
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
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send invitation");
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
  
  // Always show the form when hideToggle is true
  useEffect(() => {
    if (hideToggle) {
      setIsFormOpen(true);
    }
  }, [hideToggle]);

  return (
    <div className="w-full">
      {/* Toggle button for showing/hiding form - only show when hideToggle is false */}
      {!hideToggle && (
        <div 
          className="flex items-center justify-between py-2 px-1 cursor-pointer"
          onClick={() => setIsFormOpen(!isFormOpen)}
        >
          <h3 className="text-sm font-medium">Invite Your Friends</h3>
          <Button variant="ghost" size="sm" className="p-1 h-7 w-7" type="button">
            {isFormOpen ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
      )}
      
      {/* Form is always visible when hideToggle is true, otherwise it's collapsible */}
      {(hideToggle || isFormOpen) && (
        <form onSubmit={handleSubmit} className={hideLabels ? "space-y-2 mt-2" : "space-y-3 mt-2"}>
          {/* Name and Phone on one line */}
          <div className="grid grid-cols-2 gap-2">
            <div className={hideLabels ? "grid gap-1" : "grid gap-2"}>
              {!hideLabels && (
                <Label htmlFor="name" className="text-xs font-medium">
                  Friend's Name
                </Label>
              )}
              <div className="relative">
                <UserIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter friend's name"
                  value={form.name}
                  onChange={handleChange}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className={hideLabels ? "grid gap-1" : "grid gap-2"}>
              {!hideLabels && (
                <Label htmlFor="phone" className="text-xs font-medium">
                  Friend's Phone
                </Label>
              )}
              <div className="relative">
                <PhoneIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  name="phone"
                  placeholder="Enter phone number"
                  value={form.phone}
                  onChange={handleChange}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
          
          {/* Email on separate line */}
          <div className={hideLabels ? "grid gap-1" : "grid gap-2"}>
            {!hideLabels && (
              <Label htmlFor="email" className="text-xs font-medium">
                Friend's Email
              </Label>
            )}
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
          
          {/* Message with more vertical space */}
          <div className={hideLabels ? "grid gap-1 mt-2" : "grid gap-2 mt-2"}>
            {!hideLabels && (
              <Label htmlFor="message" className="text-xs font-medium">
                Message (Optional)
              </Label>
            )}
            <Textarea
              id="message"
              name="message"
              placeholder="Add a personal message"
              value={form.message}
              onChange={handleChange}
              className="min-h-[60px] resize-none"
              rows={2}
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
      )}
    </div>
  );
}