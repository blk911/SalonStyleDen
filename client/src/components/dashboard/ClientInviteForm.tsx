// ✅ WORKS EXACTLY AS INTENDED
// 🚫 DO NOT MODIFY WITHOUT FULL RETEST
// Component: ClientInviteForm - Handles client-to-friend invitations

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AtSignIcon, ChevronDownIcon, ChevronUpIcon, PhoneIcon, SendIcon, UserIcon, BuildingIcon, UsersIcon } from "lucide-react";
import FlowLogger from "@/lib/flow-logger";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { queryClient } from "@/lib/queryClient";
import { processApiUrl } from "@/lib/utils";

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
    inviteeType: "friend" // Default to friend, alternative is "salonOwner"
  });

  // Log form initialization
  useEffect(() => {
    FlowLogger.log('ClientInviteForm', 'Form Initialized', { clientId });
  }, [clientId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Format phone number if phone field is being updated
    if (name === 'phone') {
      // Keep only digits
      const digitsOnly = value.replace(/\D/g, '');
      
      // Format the phone number as (XXX) XXX-XXXX
      let formattedPhone = '';
      if (digitsOnly.length <= 3) {
        formattedPhone = digitsOnly;
      } else if (digitsOnly.length <= 6) {
        formattedPhone = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
      } else {
        formattedPhone = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
      }
      
      setForm((prev) => ({ ...prev, [name]: formattedPhone }));
      FlowLogger.log('ClientInviteForm', 'Form Field Updated (Formatted Phone)', { field: name, value: formattedPhone, raw: value });
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
      FlowLogger.log('ClientInviteForm', 'Form Field Updated', { field: name, value });
    }
  };
  
  // Handle invitee type selection
  const handleTypeChange = (value: string) => {
    setForm(prev => ({ ...prev, inviteeType: value }));
    FlowLogger.log('ClientInviteForm', 'Invitee Type Updated', { value });
    
    // Adjust placeholder message based on invitee type
    if (value === 'salonOwner') {
      setForm(prev => ({ 
        ...prev, 
        inviteeType: value,
        message: "Hey! I'd like to invite you to join VMB as a salon owner. Let's connect!"
      }));
    } else {
      setForm(prev => ({ 
        ...prev, 
        inviteeType: value,
        message: "Hey! I love my salon's Ven Me, Baby! style options. You should check them out!"
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    FlowLogger.log('ClientInviteForm', 'Form Submit Initiated');
    
    // Simple validation
    if (!form.name.trim()) {
      FlowLogger.error('ClientInviteForm', 'Validation Failed - Name Required', new Error('Name is required'));
      toast({
        title: "Name required",
        description: form.inviteeType === "friend" 
          ? "Please enter your friend's name" 
          : "Please enter the salon owner's name",
        variant: "destructive",
      });
      return;
    }
    
    if (!form.phone.trim() && !form.email.trim()) {
      FlowLogger.error('ClientInviteForm', 'Validation Failed - Contact Info Required', new Error('Contact info is required'));
      toast({
        title: "Contact info required",
        description: "Please enter either phone or email",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      FlowLogger.log('ClientInviteForm', 'Form Validation Passed, Processing Submission');
      
      // Context-aware validation first
      FlowLogger.log('ClientInviteForm', 'Performing Server-Side Validation');
      const validationResponse = await fetch(processApiUrl("/api/invitations"), {
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
        FlowLogger.error('ClientInviteForm', 'Server Validation Failed', errorData);
        toast({
          title: "Validation failed",
          description: errorData.error || "Unable to validate contact information",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      FlowLogger.log('ClientInviteForm', 'Server Validation Passed, Sending Invitation');
      
      // Send invitation
      const response = await fetch(processApiUrl("/api/invitations"), {
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
          type: form.inviteeType === "friend" ? "client_invitation" : "salon_owner_invitation",
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send invitation");
      }
      
      // Get response data
      const data = await response.json();
      FlowLogger.success('ClientInviteForm', 'Invitation Sent Successfully', { invitationId: data.id });
      
      // Success!
      toast({
        title: "Invitation sent!",
        description: form.inviteeType === "friend" 
          ? "Your friend will receive an invitation soon" 
          : "The salon owner will receive an invitation soon",
      });
      
      // Reset form
      setForm({
        name: "",
        phone: "",
        email: "",
        message: "Hey! I love my salon's Ven Me, Baby! style options. You should check them out!",
        inviteeType: "friend"
      });
      
      // Invalidate invitations queries to refresh the list
      FlowLogger.log('ClientInviteForm', 'Invalidating invitations queries');
      queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
      
      // Call success callback if provided
      if (onSuccess) {
        FlowLogger.log('ClientInviteForm', 'Executing Success Callback');
        onSuccess();
      }
      
    } catch (error) {
      FlowLogger.error('ClientInviteForm', 'Error Sending Invitation', error);
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
      FlowLogger.log('ClientInviteForm', 'Form Always Visible (hideToggle=true)');
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
          <h3 className="text-sm font-medium">Invite Friends & Salon Owners</h3>
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
          {/* Invitee Type Selection */}
          <div className="mb-3">
            <Label className="text-xs font-medium mb-2 block">Who are you inviting?</Label>
            <RadioGroup 
              value={form.inviteeType} 
              onValueChange={handleTypeChange}
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="friend" 
                  id="friend" 
                  className={form.inviteeType === "friend" ? "text-pink-500 bg-pink-200 border-pink-500" : "text-gray-500"} 
                />
                <Label 
                  htmlFor="friend" 
                  className={`flex items-center cursor-pointer ${form.inviteeType === "friend" ? "text-pink-500 font-medium" : ""}`}
                >
                  <UsersIcon className={`h-4 w-4 mr-1 ${form.inviteeType === "friend" ? "text-pink-500" : "text-gray-500"}`} />
                  Friend
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="salonOwner" 
                  id="salonOwner" 
                  className={form.inviteeType === "salonOwner" ? "text-amber-500 bg-amber-200 border-amber-500" : "text-gray-500"} 
                />
                <Label 
                  htmlFor="salonOwner" 
                  className={`flex items-center cursor-pointer ${form.inviteeType === "salonOwner" ? "text-amber-500 font-medium" : ""}`}
                >
                  <BuildingIcon className={`h-4 w-4 mr-1 ${form.inviteeType === "salonOwner" ? "text-amber-500" : "text-gray-500"}`} />
                  Salon Owner
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className={hideLabels ? "grid gap-1" : "grid gap-2"}>
              {!hideLabels && (
                <Label htmlFor="name" className="text-xs font-medium">
                  {form.inviteeType === "friend" ? "Friend's Name" : "Salon Owner's Name"}
                </Label>
              )}
              <div className="relative">
                <UserIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  name="name"
                  placeholder={form.inviteeType === "friend" ? "Enter friend's name" : "Enter salon owner's name"}
                  value={form.name}
                  onChange={handleChange}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className={hideLabels ? "grid gap-1" : "grid gap-2"}>
              {!hideLabels && (
                <Label htmlFor="phone" className="text-xs font-medium">
                  {form.inviteeType === "friend" ? "Friend's Phone" : "Salon Owner's Phone"}
                </Label>
              )}
              <div className="relative">
                <PhoneIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  name="phone"
                  placeholder={form.inviteeType === "friend" ? "Enter friend's phone" : "Enter salon owner's phone"}
                  value={form.phone}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault(); // Prevent form submission
                      document.getElementById('email')?.focus(); // Move to email field
                      FlowLogger.log('ClientInviteForm', 'Phone Enter pressed, moved to email field');
                    }
                  }}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
          
          {/* Email on separate line */}
          <div className={hideLabels ? "grid gap-1" : "grid gap-2"}>
            {!hideLabels && (
              <Label htmlFor="email" className="text-xs font-medium">
                {form.inviteeType === "friend" ? "Friend's Email" : "Salon Owner's Email"} <span className="ml-1 text-gray-500">EMAIL IS OPTIONAL</span>
              </Label>
            )}
            <div className="relative">
              <AtSignIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                name="email"
                placeholder={form.inviteeType === "friend" ? "Enter friend's email (optional)" : "Enter salon owner's email (optional)"}
                value={form.email}
                onChange={handleChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent form submission
                    document.getElementById('message')?.focus(); // Move to message field
                    FlowLogger.log('ClientInviteForm', 'Email Enter pressed, moved to message field');
                  }
                }}
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
