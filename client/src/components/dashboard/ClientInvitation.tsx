import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ContactValidationDialog } from "@/components/ui/ContactValidationDialog";
import { useContactValidation } from "@/hooks/useContactValidation";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  inviteHash?: string; // Unique invitation hash for tracking
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
  const [salonInfo, setSalonInfo] = useState<{name: string} | null>(null);
  const [recentInvites, setRecentInvites] = useState<ClientInvite[]>([]);
  
  // Use our contact validation hook
  const {
    phoneExists, 
    emailExists,
    errorField,
    errorMessage,
    showErrorDialog,
    setShowErrorDialog,
    formatPhoneNumber,
    validateContact,
    handleDialogClose
  } = useContactValidation();

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

  // Handle phone number changes with validation
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    
    // Validate if the phone number is complete
    const cleanPhone = formatted.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      // Small delay to prevent too many API calls
      setTimeout(() => {
        validateContact('phone', cleanPhone);
      }, 500);
    }
  };

  // Handle email changes with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    
    // Validate if the email has a basic valid format
    if (e.target.value && e.target.value.includes('@') && e.target.value.includes('.')) {
      // Small delay to prevent too many API calls
      setTimeout(() => {
        validateContact('email', e.target.value);
      }, 500);
    }
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

      // Import generate invite hash function
      const { generateInviteHash } = await import('@/lib/utils');
      
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
          sponsor: salonInfo.name, // Add the salon name as the sponsor
          inviteHash: generateInviteHash() // Generate a unique hash on the client side
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error || 'Failed to send invitation';
        
        // Handle specific validation errors
        if (errorMsg.includes('phone is already registered')) {
          await validateContact('phone', cleanPhone);
          return; // Exit early to keep form data
        } else if (errorMsg.includes('email is already registered')) {
          await validateContact('email', email);
          return; // Exit early to keep form data
        }
        
        throw new Error(errorMsg);
      }

      // Get the new invitation and add it to the list
      const newInvite = await response.json();
      setRecentInvites(prev => [newInvite, ...prev]);

      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });

      // Reset form on success
      resetForm();

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send invitation";
      
      // For errors that aren't duplicate contacts, use a toast
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to reset the form fields
  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setFirstServiceDate(new Date().toISOString().split('T')[0]);
    setSelectedServices([]);
  };
  
  // Custom dialog close handler that clears problematic fields
  const handleCustomDialogClose = () => {
    handleDialogClose();
    
    // Clear the specific field that had the error
    if (errorField === 'phone') {
      setPhone("");
    } else if (errorField === 'email') {
      setEmail("");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Send Salon to Client Invitation</h3>
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
            <div className="flex-1 relative">
              <Input
                placeholder="Phone Number"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                onBlur={() => {
                  const cleanPhone = phone.replace(/\D/g, '');
                  if (cleanPhone.length === 10) {
                    validateContact('phone', cleanPhone);
                  }
                }}
                required
                className={`w-full ${phoneExists ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              {phoneExists && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>

          {/* Line 2: Email and Date */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Input
                placeholder="Email Address"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => {
                  if (email && email.includes('@') && email.includes('.')) {
                    validateContact('email', email);
                  }
                }}
                required
                className={`w-full ${emailExists ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              {emailExists && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                </div>
              )}
            </div>
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
            disabled={isSubmitting || phoneExists || emailExists}
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
        <h3 className="text-lg font-semibold mb-4">Recent Salon to Client Invitations</h3>
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
                  <TableRow key={invite.id} className="h-[28px]">
                    {/* Name with truncation */}
                    <TableCell className="font-medium py-1">
                      {invite.name.length > 12 ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {invite.name.substring(0, 10)}...
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{invite.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        invite.name
                      )}
                    </TableCell>
                    
                    {/* Phone with truncation */}
                    <TableCell className="py-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              {formatPhoneNumber(invite.phone).substring(0, 7)}•••
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{formatPhoneNumber(invite.phone)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    
                    {/* Email with truncation */}
                    <TableCell className="py-1">
                      {invite.email && invite.email.length > 15 ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {invite.email.substring(0, 12)}...
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{invite.email}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        invite.email
                      )}
                    </TableCell>
                    
                    {/* Status badge */}
                    <TableCell className="py-1">
                      <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200 text-xs">
                        {invite.status || 'Pending'}
                      </Badge>
                      
                      {/* Display Invitation Hash ID below status */}
                      {invite.inviteHash && (
                        <div className="text-[10px] text-gray-500 mt-1">
                          #{invite.inviteHash}
                        </div>
                      )}
                    </TableCell>
                    
                    {/* Service date with truncation */}
                    <TableCell className="py-1 text-xs">
                      {invite.firstServiceDate || 'Not scheduled'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </Card>
      
      {/* Use our shared validation dialog component */}
      <ContactValidationDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        errorField={errorField}
        errorMessage={errorMessage}
        onClose={handleCustomDialogClose}
      />
    </div>
  );
}