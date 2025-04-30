import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertCircle, 
  ChevronDown, 
  Clock, 
  Calendar, 
  Phone, 
  Mail, 
  Clock3, 
  CheckCircle, 
  Link as LinkIcon,
  CalendarClock,
  Gift as GiftIcon,
  X,
  Send,
  Loader2,
  AlertTriangle,
  FileText
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { RenderedInvitation } from '@/components/invitations/RenderedInvitation';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { Link } from "wouter";

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

interface SalonLicenseInfo {
  licenseVerified: boolean;
  licenseStatus: string;
  currentInvitationCount: number;
  invitationLimit: number;
}

interface ClientInvitationProps {
  salonId?: number;
}

// Helper function to format phone numbers
function formatPhoneNumber(phoneNumberString: string) {
  const cleaned = phoneNumberString.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phoneNumberString;
}

// Helper function to format dates
function formatDate(dateString: string | undefined) {
  if (!dateString) return 'No date';
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (e) {
    return dateString;
  }
}

export default function ClientInvitation({ salonId }: ClientInvitationProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  
  // Default message for salon-to-client invitations
  const defaultSalonToClientMessage = "Hi [nm], We are joining Ven Me, Baby! It's all about YOU! Create a request, enter your BF, admirer, or Mr. and send your gift request for [insert sty opt NAME]. VMB fits today's lifestyle. It's direct, it's easy...and he gets to choose... Ven Me, Baby! \n❤️❤️❤️\n\nVMB:[RANDOM ID]\n\nPS: Clients register here: 🏠";
  
  const [notes, setNotes] = useState(defaultSalonToClientMessage);
  const [firstServiceDate, setFirstServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [salonInfo, setSalonInfo] = useState<{name: string} | null>(null);
  const [licenseInfo, setLicenseInfo] = useState<SalonLicenseInfo | null>(null);
  const [recentInvites, setRecentInvites] = useState<ClientInvite[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<{
    name: string;
    phone: string;
    email: string;
    notes: string;
    firstServiceDate: string;
    favoriteServices: string[];
  } | null>(null);
  
  // Process message placeholder replacements
  const processMessage = (message: string, clientName: string, styleOption: string) => {
    // Replace placeholders with actual values
    return message
      .replace(/\[nm\]/g, clientName)
      .replace(/\[insert sty opt NAME\]/g, styleOption || "Salon Service")
      .replace(/\[RANDOM ID\]/g, `VMB-${Math.floor(100000 + Math.random() * 900000)}`);
  };
  
  // State for collapsible sections - all closed by default
  const [sendFormOpen, setSendFormOpen] = useState(false);
  const [pendingInvitesOpen, setPendingInvitesOpen] = useState(false);
  const [scheduledInvitesOpen, setScheduledInvitesOpen] = useState(false);
  const [completedInvitesOpen, setCompletedInvitesOpen] = useState(false);
  
  // We're using inline license warning with Update/Close buttons instead of a separate dialog
  
  // All sections start closed by default now
  
  // Simplified validation pattern since we're not using the shared hook
  const [errorField, setErrorField] = useState<'' | 'phone' | 'email'>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  
  // Format a phone number with common US format
  const formatContactPhone = (input: string) => {
    // Keep only digits
    const cleaned = input.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };
  
  // Validate contact info against API
  const validateContact = async (type: 'phone' | 'email', value: string) => {
    try {
      // Basic validation
      if (type === 'phone' && value.replace(/\D/g, '').length !== 10) {
        setErrorField('phone');
        setErrorMessage('Phone number must be 10 digits');
        setShowErrorDialog(true);
        return;
      }
      
      if (type === 'email' && !value.includes('@')) {
        setErrorField('email');
        setErrorMessage('Invalid email format');
        setShowErrorDialog(true);
        return;
      }
      
      // Check if contact exists in database
      const response = await fetch(`/api/validate-contact?type=${type}&value=${encodeURIComponent(value)}`);
      const data = await response.json();
      
      if (data.exists) {
        if (type === 'phone') {
          setPhoneExists(true);
        } else {
          setEmailExists(true);
        }
        
        setErrorField(type);
        setErrorMessage(`This ${type} is already registered in our system.`);
        setShowErrorDialog(true);
      } else {
        // Clear errors for this field
        if (type === 'phone') {
          setPhoneExists(false);
        } else {
          setEmailExists(false);
        }
      }
    } catch (error) {
      console.error(`Error validating ${type}:`, error);
    }
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    setShowErrorDialog(false);
  };

  useEffect(() => {
    if (salonId) {
      fetchSalonInfo();
      fetchSalonInvites();
      
      // Set global variables for context-aware validation
      // These will be used by the useContactValidation hook
      if (typeof window !== 'undefined') {
        window['_currentSenderId'] = salonId;
        window['_validationContext'] = 'invitation';
      }
      
      // Clean up function to remove globals when component unmounts
      return () => {
        if (typeof window !== 'undefined') {
          // Use safer bracket notation for property access
          if ('_currentSenderId' in window) {
            delete window['_currentSenderId'];
          }
          if ('_validationContext' in window) {
            delete window['_validationContext'];
          }
        }
      };
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
        
        // Check license status and invitations limit
        const licenseResponse = await fetch(`/api/salons/${salonId}/invitation-limit`);
        if (licenseResponse.ok) {
          const licenseData = await licenseResponse.json();
          setLicenseInfo({
            licenseVerified: licenseData.licenseVerified,
            licenseStatus: licenseData.licenseStatus,
            currentInvitationCount: licenseData.currentCount,
            invitationLimit: licenseData.limit
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch salon info:', error);
    }
  };

  const fetchSalonInvites = async () => {
    if (!salonId) return;
    
    try {
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

  // Handle phone number changes with validation
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatContactPhone(e.target.value);
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
      // Check if invitation limit has been reached for unverified salons
      if (hasReachedLimit && licenseInfo && !licenseInfo.licenseVerified) {
        // Make sure the license warning is visible
        setSendFormOpen(true);
        setIsSubmitting(false);
        return;
      }
      
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
      
      // Process message with placeholders before saving
      const processedNotes = processMessage(
        notes,
        name,
        selectedServices.length > 0 ? selectedServices[0] : ''
      );
      
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone: cleanPhone,
          email: email || null, // Make email null if it's empty
          notes: processedNotes, // Use the processed message with placeholders replaced
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
    setNotes(defaultSalonToClientMessage);
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

  // Sort invitations by most recent first and filter by status
  const sortedInvites = [...recentInvites].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const pendingInvitations = sortedInvites.filter(invite => 
    invite.status === 'pending' || !invite.status
  );
  
  const scheduledInvitations = sortedInvites.filter(invite => 
    invite.status === 'scheduled' || invite.status === 'appointment'
  );
  
  const completedInvitations = sortedInvites.filter(invite => 
    invite.status === 'complete' || invite.status === 'accepted'
  );
  
  // We'll remove this import and use our local types since they're already compatible
  // This fixes the type error related to the incompatible status field
  
  // Determine if invitation limit has been reached
  const hasReachedLimit = licenseInfo ? 
    licenseInfo.currentInvitationCount >= licenseInfo.invitationLimit : false;

  return (
    <div className="space-y-6">
      {/* Send Invitation Form Section */}
      <Card className="rounded-xl shadow-sm overflow-hidden border border-pink-200">
        <div 
          className="bg-gradient-to-br from-pink-50 to-pink-100 pb-2 pt-2 px-3 cursor-pointer flex justify-between items-center" 
          onClick={() => setSendFormOpen(!sendFormOpen)}
        >
          <h3 className="font-medium text-xs sm:text-sm text-pink-800 flex items-center">
            Step 1: Send Client Invitation
            {hasReachedLimit && licenseInfo && !licenseInfo.licenseVerified && !sendFormOpen && (
              <Badge className="ml-2 bg-red-100 text-red-800 border-red-200 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Update Required
              </Badge>
            )}
          </h3>
          <ChevronDown 
            className={`h-4 w-4 text-pink-800 transition-transform ${sendFormOpen ? 'transform rotate-180' : ''}`} 
          />
        </div>
        
        {sendFormOpen && (
          <CardContent className="p-4">
            {/* License Verification Status */}
            {licenseInfo && (
              <div className={`mb-4 rounded-md text-sm ${
                licenseInfo.licenseVerified 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                <div 
                  className="p-3 flex items-center justify-between cursor-pointer"
                  onClick={() => setSendFormOpen(!sendFormOpen)}
                >
                  <div className="flex items-center space-x-2">
                    {licenseInfo.licenseVerified ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-600" />
                    )}
                    <span className="font-medium">
                      {licenseInfo.licenseVerified 
                        ? 'License Verified' 
                        : 'License Verification Pending'}
                    </span>
                    {hasReachedLimit && !licenseInfo.licenseVerified && !sendFormOpen && (
                      <Badge className="ml-2 bg-red-100 text-red-800 border-red-200">
                        Limit Reached
                      </Badge>
                    )}
                  </div>
                  <ChevronDown 
                    className={`h-4 w-4 text-amber-800 transition-transform ${sendFormOpen ? 'transform rotate-180' : ''}`} 
                  />
                </div>
                
                {sendFormOpen && (
                  <div className="px-3 pb-3">
                    <div className="mt-1">
                      {licenseInfo.licenseVerified 
                        ? 'Your salon license is verified. You can send unlimited client invitations.' 
                        : `Unverified salons can send a maximum of ${licenseInfo.invitationLimit} client invitations. You have used ${licenseInfo.currentInvitationCount} so far.`}
                    </div>
                    {hasReachedLimit && !licenseInfo.licenseVerified && (
                      <div className="mt-2">
                        <div className="text-red-600 font-medium mb-2">
                          You have reached your invitation limit. Once your license is verified, you'll have unlimited invitations.
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => setSendFormOpen(false)}
                          >
                            Close
                          </Button>
                          <Link to="/salon-license" className="flex-1">
                            <Button 
                              className="w-full bg-pink-500 hover:bg-pink-600"
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Update License Information
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Replaced with dialog popup instead */}
              {/* Line 1: Name and Phone */}
              <div className="flex gap-4">
                <Input
                  placeholder="Client Name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    // Name will be updated in message when Enter is pressed (handled in onKeyDown)
                  }}
                  required
                  className="flex-1"
                  onKeyDown={(e) => {
                    // Update message with name when Enter is pressed
                    if (e.key === 'Enter' && name.trim().length > 0) {
                      e.preventDefault();
                      
                      // Update notes with name when Enter is pressed
                      const serviceToUse = selectedServices.length > 0 ? selectedServices[0] : 'Salon Service';
                      setNotes(processMessage(notes, name, serviceToUse));
                      
                      // Move to next field
                      const phoneInput = document.querySelector('input[placeholder="Phone Number"]') as HTMLInputElement;
                      if (phoneInput) phoneInput.focus();
                    }
                  }}
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
                    onKeyDown={(e) => {
                      // Move to next field on Enter when phone is complete
                      const cleanPhone = phone.replace(/\D/g, '');
                      if (e.key === 'Enter' && cleanPhone.length === 10) {
                        e.preventDefault();
                        const emailInput = document.querySelector('input[placeholder="Email Address"]') as HTMLInputElement;
                        if (emailInput) emailInput.focus();
                      }
                    }}
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
                    
                    className={`w-full ${emailExists ? 'border-red-500 focus:ring-red-500' : ''}`}
                    onKeyDown={(e) => {
                      // Move directly to French Tips button on Enter (skip date)
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        
                        // Try to find the French Tips button by looking for buttons with that text
                        const buttons = document.querySelectorAll('button');
                        let frenchTipsButton = null;
                        
                        for (let i = 0; i < buttons.length; i++) {
                          if (buttons[i].textContent?.trim() === 'French Tips') {
                            frenchTipsButton = buttons[i];
                            break;
                          }
                        }
                        
                        if (frenchTipsButton) {
                          (frenchTipsButton as HTMLButtonElement).focus();
                        } else {
                          // Fallback to first service button if French Tips not found
                          const firstServiceButton = document.querySelector('.flex.flex-wrap.gap-2 button') as HTMLButtonElement;
                          if (firstServiceButton) firstServiceButton.focus();
                        }
                      }
                    }}
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
                  readOnly
                  disabled
                  className="flex-1 bg-gray-50 cursor-not-allowed"
                />
              </div>

              {/* Line 3: Salon Name (read-only) */}
              <Input
                value={salonInfo?.name || 'Loading salon...'}
                disabled
                className="bg-gray-50"
              />

              {/* Line 4: Favorite Services */}
              <div className="flex flex-wrap gap-2 mb-3">
                <p className="w-full text-xs text-gray-600 mb-1">Select service options:</p>
                {DEFAULT_SERVICES.map(service => (
                  <Button
                    key={service}
                    type="button"
                    variant={selectedServices.includes(service) ? "default" : "outline"}
                    onClick={() => {
                      const newSelectedServices = selectedServices.includes(service)
                        ? selectedServices.filter(s => s !== service)
                        : [...selectedServices, service];
                      
                      setSelectedServices(newSelectedServices);
                      
                      // Always update the notes when service selection changes
                      const serviceToUse = newSelectedServices.length > 0 ? newSelectedServices[0] : 'Salon Service';
                      
                      // Create a new message with the updated service
                      const updatedMessage = notes.replace(/Salon Service|French Tips|Gel Manicure|Acrylics|Custom Design/g, serviceToUse);
                      setNotes(processMessage(updatedMessage, name, serviceToUse));
                    }}
                    className={selectedServices.includes(service) ? 'bg-pink-500 hover:bg-pink-600' : ''}
                  >
                    {service}
                  </Button>
                ))}
              </div>

              {/* Line 5: Notes */}
              <Textarea
                placeholder="Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                onKeyDown={(e) => {
                  // Tab to preview button
                  if (e.key === 'Tab' && !e.shiftKey) {
                    // Let default tab behavior work
                  } else if (e.key === 'Enter' && !e.shiftKey) {
                    // Move to preview button on Enter (except when shift is pressed for new line)
                    e.preventDefault();
                    // Focus on the preview button
                    const previewButton = document.querySelector('button.w-full.bg-pink-500') as HTMLButtonElement;
                    if (previewButton) previewButton.focus();
                  }
                }}
              />

              {/* Preview Button */}
              <Button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  
                  // Check if invitation limit is reached
                  if (hasReachedLimit && !licenseInfo?.licenseVerified) {
                    // Make sure the warning section is visible
                    setSendFormOpen(true);
                    return;
                  }

                  // Validate fields first
                  const cleanPhone = phone.replace(/\D/g, '');
                  if (!name || cleanPhone.length !== 10) {
                    toast({
                      title: "Missing Information",
                      description: "Please fill out all required fields",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  if (phoneExists || (email && emailExists)) {
                    toast({
                      title: "Validation Error",
                      description: "Please fix validation errors before continuing",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  // Process message for preview to replace placeholders
                  const processedNotes = processMessage(
                    notes, 
                    name, 
                    selectedServices.length > 0 ? selectedServices[0] : ''
                  );
                  
                  // Set preview data and show modal
                  setPreviewData({
                    name,
                    phone,
                    email,
                    notes: processedNotes,
                    firstServiceDate,
                    favoriteServices: selectedServices,
                  });
                  setShowPreviewModal(true);
                }}
                disabled={isSubmitting}
                className="w-full bg-pink-500 hover:bg-pink-600"
              >
                <Send className="h-4 w-4 mr-2" />
                Preview Invitation
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
          </CardContent>
        )}
      </Card>

      {/* PENDING INVITATIONS Section */}
      <Card className="rounded-xl shadow-sm overflow-hidden border border-amber-200">
        <div 
          className="bg-gradient-to-br from-amber-50 to-amber-100 pb-2 pt-2 px-3 cursor-pointer flex justify-between items-center" 
          onClick={() => setPendingInvitesOpen(!pendingInvitesOpen)}
        >
          <h3 className="font-medium text-xs sm:text-sm text-amber-800 flex items-center">
            <Clock3 className="h-3.5 w-3.5 mr-1.5 text-amber-700" /> 
            Step 2: Pending Invitations {pendingInvitations.length > 0 && (
              <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
                {pendingInvitations.length}
              </Badge>
            )}
          </h3>
          <ChevronDown 
            className={`h-4 w-4 text-amber-800 transition-transform ${pendingInvitesOpen ? 'transform rotate-180' : ''}`} 
          />
        </div>
        
        {pendingInvitesOpen && (
          <CardContent className="p-4">
            {pendingInvitations.length === 0 ? (
              <p className="text-center text-gray-500 my-4">No pending invitations.</p>
            ) : (
              <ScrollArea className="h-[200px]">
                <Table>
                  {/* Removed table header - no labels above clients as requested */}
                  <TableBody>
                    {pendingInvitations.map((invite) => (
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
                                  <p className="font-medium">{invite.name}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            invite.name
                          )}
                        </TableCell>
                        
                        {/* Phone with icon and tooltip */}
                        <TableCell className="py-1 text-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Phone className="h-3.5 w-3.5 cursor-help inline-block text-amber-700" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">{formatPhoneNumber(invite.phone)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        
                        {/* Email with icon and tooltip */}
                        <TableCell className="py-1 text-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Mail className="h-3.5 w-3.5 cursor-help inline-block text-amber-700" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">{invite.email}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        
                        {/* Invitation Hash ID with icon and tooltip */}
                        <TableCell className="py-1 text-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <LinkIcon className="h-3.5 w-3.5 cursor-help inline-block text-amber-700" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">{invite.inviteHash || 'No ID'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        
                        {/* Service date with icon and tooltip */}
                        <TableCell className="py-1 text-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Calendar className="h-3.5 w-3.5 cursor-help inline-block text-amber-700" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">{formatDate(invite.firstServiceDate) || 'Not scheduled'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>

                        {/* View button with icon */}
                        <TableCell className="py-1 text-center">
                          <Link to={`/invitation-preview/${invite.inviteHash}`} className="inline-block">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-amber-700 hover:text-amber-900 hover:bg-amber-50">
                                    <GiftIcon className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium">View Invitation</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        )}
      </Card>
      
      {/* APPOINTMENT SCHEDULED Section */}
      <Card className="rounded-xl shadow-sm overflow-hidden border border-indigo-200">
        <div 
          className="bg-gradient-to-br from-indigo-50 to-indigo-100 pb-2 pt-2 px-3 cursor-pointer flex justify-between items-center" 
          onClick={() => setScheduledInvitesOpen(!scheduledInvitesOpen)}
        >
          <h3 className="font-medium text-xs sm:text-sm text-indigo-800 flex items-center">
            <CalendarClock className="h-3.5 w-3.5 mr-1.5 text-indigo-700" /> 
            Step 2: Appointment Scheduled {scheduledInvitations.length > 0 && (
              <Badge className="ml-2 bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px]">
                {scheduledInvitations.length}
              </Badge>
            )}
          </h3>
          <ChevronDown 
            className={`h-4 w-4 text-indigo-800 transition-transform ${scheduledInvitesOpen ? 'transform rotate-180' : ''}`} 
          />
        </div>
        
        {scheduledInvitesOpen && (
          <CardContent className="p-4">
            {scheduledInvitations.length === 0 ? (
              <p className="text-center text-gray-500 my-4">No scheduled appointments.</p>
            ) : (
              <div className="space-y-4">
                {scheduledInvitations.map(invite => (
                  <Card key={invite.id} className="overflow-hidden border-indigo-200">
                    <CardHeader className="py-2 px-3 bg-gradient-to-r from-indigo-50 to-indigo-100 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-medium text-indigo-800 flex items-center">
                        <Calendar className="h-4 w-4 mr-1.5 text-indigo-600" />
                        {invite.name}
                      </CardTitle>
                      <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px]">
                        {formatDate(invite.firstServiceDate)}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-3 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        <span className="font-medium text-gray-700">Phone:</span>
                        <span className="ml-1">{formatPhoneNumber(invite.phone)}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        <span className="font-medium text-gray-700">Email:</span>
                        <span className="ml-1 truncate">{invite.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        <span className="font-medium text-gray-700">Created:</span>
                        <span className="ml-1">{formatDate(invite.createdAt)}</span>
                      </div>
                      <div className="flex items-center">
                        <LinkIcon className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                        <Link to={`/appointments/${invite.id}`} className="text-indigo-600 hover:underline">
                          View Appointment
                        </Link>
                      </div>
                      {invite.favoriteServices && invite.favoriteServices.length > 0 && (
                        <div className="col-span-1 sm:col-span-2 flex flex-wrap gap-1 mt-1">
                          {invite.favoriteServices.map(service => (
                            <Badge key={service} variant="outline" className="text-[9px] bg-indigo-50">{service}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
      
      {/* COMPLETED VMB PROMOS Section */}
      <Card className="rounded-xl shadow-sm overflow-hidden border border-emerald-200">
        <div 
          className="bg-gradient-to-br from-emerald-50 to-emerald-100 pb-2 pt-2 px-3 cursor-pointer flex justify-between items-center" 
          onClick={() => setCompletedInvitesOpen(!completedInvitesOpen)}
        >
          <h3 className="font-medium text-xs sm:text-sm text-emerald-800 flex items-center">
            <GiftIcon className="h-3.5 w-3.5 mr-1.5 text-emerald-700" /> 
            Step 3: Completed VMB Promos {completedInvitations.length > 0 && (
              <Badge className="ml-2 bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                {completedInvitations.length}
              </Badge>
            )}
          </h3>
          <ChevronDown 
            className={`h-4 w-4 text-emerald-800 transition-transform ${completedInvitesOpen ? 'transform rotate-180' : ''}`} 
          />
        </div>
        
        {completedInvitesOpen && (
          <CardContent className="p-4">
            {completedInvitations.length === 0 ? (
              <p className="text-center text-gray-500 my-4">No completed promotions.</p>
            ) : (
              <div className="space-y-4">
                {completedInvitations.map(invite => (
                  <Card key={invite.id} className="overflow-hidden border-emerald-200">
                    <CardHeader className="py-2 px-3 bg-gradient-to-r from-emerald-50 to-emerald-100 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-medium text-emerald-800 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1.5 text-emerald-600" />
                        {invite.name}
                      </CardTitle>
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                        ID: {invite.id}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-3 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        <span className="font-medium text-gray-700">Phone:</span>
                        <span className="ml-1">{formatPhoneNumber(invite.phone)}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        <span className="font-medium text-gray-700">Email:</span>
                        <span className="ml-1 truncate">{invite.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        <span className="font-medium text-gray-700">First Service:</span>
                        <span className="ml-1">{formatDate(invite.firstServiceDate)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        <span className="font-medium text-gray-700">Created:</span>
                        <span className="ml-1">{formatDate(invite.createdAt)}</span>
                      </div>
                      <div className="col-span-1 sm:col-span-2 flex items-center mt-1">
                        <LinkIcon className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                        <Link to={`/invitation-preview/${invite.inviteHash}`} className="text-emerald-600 hover:underline">
                          View Completed Invitation
                        </Link>
                      </div>
                      {invite.favoriteServices && invite.favoriteServices.length > 0 && (
                        <div className="col-span-1 sm:col-span-2 flex flex-wrap gap-1 mt-1">
                          {invite.favoriteServices.map(service => (
                            <Badge key={service} variant="outline" className="text-[9px] bg-emerald-50">{service}</Badge>
                          ))}
                        </div>
                      )}
                      {invite.notes && (
                        <div className="col-span-1 sm:col-span-2 mt-1">
                          <p className="text-[10px] text-gray-600 italic">{invite.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
      
      {/* Use our shared validation dialog component */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Validation Error</DialogTitle>
            <DialogDescription>
              There was an issue with the information you provided.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="text-center p-4 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-red-700 mb-1">
                {errorField === 'phone' ? 'Phone Number Issue' : 
                 errorField === 'email' ? 'Email Address Issue' : 'Validation Error'}
              </h3>
              <p className="text-red-600">{errorMessage}</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              onClick={handleCustomDialogClose}
            >
              Try Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader className="pb-2 border-b border-amber-200">
            <DialogTitle className="text-center text-amber-800 text-xl flex items-center justify-center">
              <Mail className="h-5 w-5 mr-2 text-amber-600" />
              Salon Invitation Preview
            </DialogTitle>
            <DialogDescription className="text-center">
              Please review your invitation carefully before sending
            </DialogDescription>
          </DialogHeader>
          
          {previewData && (
            <div className="py-4">
              <div className="mb-4 border border-amber-200 rounded-md p-3 bg-amber-50">
                <p className="text-sm font-medium text-gray-700">Recipient: {previewData.name}</p>
                <p className="text-sm text-gray-600">Phone: {formatPhoneNumber(previewData.phone)}</p>
                <p className="text-sm text-gray-600">Email: {previewData.email}</p>
                <p className="text-sm text-gray-600">Service Date: {formatDate(previewData.firstServiceDate)}</p>
                {previewData.favoriteServices.length > 0 && (
                  <div className="mt-1">
                    <p className="text-sm text-gray-700">Services:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {previewData.favoriteServices.map(service => (
                        <Badge key={service} variant="outline" className="bg-amber-50">{service}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <RenderedInvitation 
                  inviteId="PREVIEW"
                  recipientName={previewData.name}
                  styleOption={previewData.favoriteServices[0] || "Salon Service"}
                  price="varies"
                  time="scheduled"
                  senderName={salonInfo?.name || ''}
                  salonName={salonInfo?.name || ''}
                  salonInitiated={true}
                />
                
                {/* We've removed the duplicate plain text message preview since it's already included
                    in the RenderedInvitation component above */}
              </div>
            </div>
          )}
          
          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowPreviewModal(false)}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Back to Form
            </Button>
            <Button 
              type="button" 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium"
              onClick={(e) => {
                setShowPreviewModal(false);
                // Trigger the form submission after confirmation
                handleSubmit(e as unknown as React.FormEvent);
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 
                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : 
                <Send className="h-5 w-5 mr-2" />
              }
              Confirm & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* We integrated the license warning with Update/Close buttons inline instead of using a separate dialog */}
    </div>
  );
}