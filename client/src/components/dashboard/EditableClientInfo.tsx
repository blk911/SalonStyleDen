import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPhoneNumber, getImageUrl } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  PhoneIcon, 
  AtSignIcon,
  MapPinIcon, 
  UploadIcon,
  PencilIcon,
  XIcon
} from "lucide-react";

// Social media item interface
export interface SocialMediaItem {
  platform: string;
  handle: string;
}

// Client information interface
export interface ClientInfo {
  id: number;
  name: string;
  phone: string;
  email: string;
  isCurrentClient: boolean;
  notes?: string;
  favoriteServices?: string[];
  salonId?: number;
  salonName?: string;
  sponsor?: string;
  type: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  socialMedia?: SocialMediaItem[] | null;
  photoUrl?: string;
}

interface EditableClientInfoProps {
  client: ClientInfo;
  onSave: (updatedClient: ClientInfo) => void;
  defaultEditing?: boolean;
}

export default function EditableClientInfo({ client, onSave, defaultEditing = false }: EditableClientInfoProps) {
  // State for UI controls and edited client data
  const [isEditing, setIsEditing] = useState(true); // Always keep this true for the component to work
  const [showEditForm, setShowEditForm] = useState(defaultEditing);
  const [editedClient, setEditedClient] = useState<ClientInfo>({ ...client });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialPlatform, setSocialPlatform] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Update showEditForm when defaultEditing changes
  useEffect(() => {
    console.log("defaultEditing changed to:", defaultEditing);
    setShowEditForm(defaultEditing);
  }, [defaultEditing]);

  // Handle text input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedClient(prev => ({ ...prev, [name]: value }));
  };

  // Handle image selection and upload
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload the file using fetch directly to ensure proper FormData handling
      console.log('Uploading client photo:', file.name);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
      }
      
      const response = await uploadResponse.json();
      console.log('Photo upload response:', response);

      // Update the client object with the new photo URL
      if (response && response.url) {
        // Store the raw URL, getImageUrl will handle cache busting when used
        const imageUrl = response.url;
        console.log('Set client photo URL:', imageUrl);
        
        // Force invalidate any existing image cache
        if (typeof window !== 'undefined') {
          const img = new Image();
          img.src = getImageUrl(imageUrl) + '&nocache=' + Date.now();
        }
        
        // Update state with the new image URL
        setEditedClient(prev => ({ 
          ...prev, 
          photoUrl: imageUrl
        }));
        
        // Also update in database immediately to avoid losing the change
        try {
          console.log(`Saving client photo URL directly to database: ${imageUrl}`);
          // Make API call to update just the photo URL using apiRequest
          const updatedClient = await apiRequest(`/api/clients/${editedClient.id}`, {
            method: 'PUT',
            data: {
              id: editedClient.id,
              photoUrl: imageUrl
            }
          });
          
          console.log('Client photo URL updated in database:', updatedClient.photoUrl);
          // Invalidate React Query cache after photo upload
          await queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
          await queryClient.invalidateQueries({ queryKey: ['/api/clients', editedClient.id.toString()] });
        } catch (err) {
          console.error('Error saving client photo URL directly:', err);
          // Continue anyway as we've updated the local state
        }
      }
      
      toast({
        title: "Photo uploaded",
        description: "Your photo has been uploaded successfully.",
        duration: 3000
      });
    } catch (error) {
      console.error('Error uploading client photo:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload the photo. Please try again.",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle social media addition
  const addSocialMedia = () => {
    if (!socialPlatform || !socialHandle) return;
    
    const newSocialMedia = [...(editedClient.socialMedia || []), { platform: socialPlatform, handle: socialHandle }];
    setEditedClient(prev => ({ ...prev, socialMedia: newSocialMedia }));
    setSocialPlatform("");
    setSocialHandle("");
  };

  // Handle social media deletion
  const removeSocialMedia = (index: number) => {
    if (!editedClient.socialMedia) return;
    
    const newSocialMedia = [...editedClient.socialMedia];
    newSocialMedia.splice(index, 1);
    setEditedClient(prev => ({ ...prev, socialMedia: newSocialMedia }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Save client information to the database
      console.log('Submitting client update:', editedClient);
      const updatedClient = await apiRequest(`/api/clients/${editedClient.id}`, {
        method: 'PUT',
        data: editedClient
      });
      
      console.log('Client updated successfully through apiRequest:', updatedClient);
      console.log('Returned client photo URL:', updatedClient.photoUrl);
      
      // Invalidate React Query cache for client data FIRST to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/clients', editedClient.id.toString()] });
      
      // Remove any query parameters to clean up the URL without page reload
      if (window.history && window.location.search) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
      
      // Update the client object in the parent component to reflect changes
      // AFTER the cache has been invalidated
      onSave({
        ...updatedClient,
        // Ensure the photoUrl is properly set even if the server didn't return it
        photoUrl: updatedClient.photoUrl || editedClient.photoUrl
      });
      
      // Exit edit mode and form display
      setIsEditing(false);
      setShowEditForm(false);
      
      toast({
        title: "Successfully updated profile",
        description: "Your changes have been saved.",
        duration: 3000
      });

      // Force any cached images to reload
      if (updatedClient.photoUrl) {
        const timestamp = Date.now();
        const cachedImageUrl = getImageUrl(updatedClient.photoUrl) + `?t=${timestamp}`;
        // Preload the image
        const img = new Image();
        img.src = cachedImageUrl;
      }
    } catch (error) {
      console.error("Failed to update client info:", error);
      toast({
        title: "Error updating profile",
        description: error instanceof Error ? error.message : "Failed to update your information",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    // Reset edited client data to original values
    setEditedClient({ ...client });
  };

  return (
    <Card className="border border-pink-100 shadow-sm">
      <CardContent className="p-4">

        {!showEditForm ? (
          <div className="flex flex-col md:flex-row md:gap-6">
            {/* Left column (33%) with photo */}
            <div className="w-full md:w-1/3 flex flex-col items-center mb-4 md:mb-0">
              <div className="relative group">
                <Avatar className="h-24 w-24 md:h-32 md:w-32 mb-4 border-2 border-pink-100 ring-2 ring-pink-50 shadow-md">
                  <AvatarImage 
                    src={editedClient.photoUrl ? getImageUrl(editedClient.photoUrl, 'client-card') : '/assets/salon-card.png'}
                    alt={editedClient.name}
                    className="object-cover"
                    onError={(e) => {
                      console.error("Error loading client avatar image");
                      console.log("Attempted to load:", editedClient.photoUrl ? getImageUrl(editedClient.photoUrl, 'client-card') : 'default image');
                      e.currentTarget.src = '/assets/salon-card.png';
                    }} 
                  />
                  <AvatarFallback className="bg-pink-50 text-pink-600 text-2xl">
                    {editedClient.name?.substring(0, 2).toUpperCase() || "CL"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            
            {/* Right column (66%) with client info */}
            <div className="w-full md:w-2/3 space-y-4">
              <div>
                <h2 className="font-semibold text-xl text-center md:text-left mb-2">{editedClient.name}</h2>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center text-gray-700">
                    <PhoneIcon className="h-3 w-3 mr-2 text-pink-500" />
                    <span className="text-sm">{editedClient.phone}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <AtSignIcon className="h-3 w-3 mr-2 text-pink-500" />
                    <span className="text-sm">{editedClient.email}</span>
                  </div>
                  
                  {editedClient.sponsor && (
                    <div className="flex items-center text-gray-700">
                      <svg className="h-3 w-3 mr-2 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      <span className="text-sm font-medium text-pink-600">Sponsor: {editedClient.sponsor}</span>
                    </div>
                  )}
                  
                  {editedClient.address && (
                    <div className="flex items-start mt-1">
                      <MapPinIcon className="h-3 w-3 mr-2 mt-0.5 text-pink-500" />
                      <div className="text-sm text-gray-700">
                        <span className="block">{editedClient.address}</span>
                        {(editedClient.city || editedClient.state || editedClient.zipCode) && (
                          <span className="block">
                            {editedClient.city}{editedClient.city && editedClient.state ? ', ' : ''}{editedClient.state} {editedClient.zipCode}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {editedClient.socialMedia && editedClient.socialMedia.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <h3 className="text-xs font-medium text-gray-500 mb-2">Social Media</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {editedClient.socialMedia.map((social, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between px-3 py-1.5 rounded bg-pink-50 text-xs"
                      >
                        <span className="font-medium text-gray-700">{social.platform}</span>
                        <span className="text-pink-600">{social.handle}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Client Photo Upload Section - only shown when EDIT PROFILE is clicked */}
            <div className="mb-3 flex flex-col items-center">
              <div className="flex justify-between items-center w-full mb-2">
                <h4 className="text-xs text-gray-500">Profile Photo</h4>
                <div className="h-px bg-gray-200 flex-grow mx-2"></div>
              </div>

              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16 border-2 border-pink-100">
                  <AvatarImage 
                    src={editedClient.photoUrl ? getImageUrl(editedClient.photoUrl) : '/assets/salon-card.png'}
                    alt={editedClient.name}
                    onError={(e) => {
                      console.error("Error loading avatar image in edit mode");
                      console.log("Attempted to load:", editedClient.photoUrl ? getImageUrl(editedClient.photoUrl) : 'default image');
                      e.currentTarget.src = '/assets/salon-card.png';
                    }} 
                  />
                  <AvatarFallback className="bg-pink-100 text-pink-600 text-xl">
                    {editedClient.name?.substring(0, 2).toUpperCase() || "CL"}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <UploadIcon className="h-3 w-3 mr-1" />
                    {isUploading ? "Uploading..." : "Upload Photo"}
                  </Button>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Personal Information */}
              <div className="space-y-2">
                <div className="flex justify-between items-center w-full">
                  <h4 className="text-xs text-gray-500">Personal Information</h4>
                  <div className="h-px bg-gray-200 flex-grow mx-2"></div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="name" className="text-xs">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={editedClient.name}
                      onChange={handleChange}
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-xs">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={editedClient.email}
                      onChange={handleChange}
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-xs">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={editedClient.phone}
                    onChange={handleChange}
                    className="h-8 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs text-gray-500">Address</h4>
                  <div className="h-px bg-gray-200 flex-grow mx-2"></div>
                </div>

                <div>
                  <Input
                    id="address"
                    name="address"
                    value={editedClient.address || ''}
                    onChange={handleChange}
                    className="text-xs h-8"
                    placeholder="Street Address"
                  />
                </div>

                <div>
                  <Input
                    id="city"
                    name="city"
                    value={editedClient.city || ''}
                    onChange={handleChange}
                    className="text-xs h-8"
                    placeholder="City"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      id="state"
                      name="state"
                      value={editedClient.state || ''}
                      onChange={handleChange}
                      className="text-xs h-8"
                      placeholder="State (CA)"
                      maxLength={2}
                    />
                  </div>

                  <div>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      value={editedClient.zipCode || ''}
                      onChange={handleChange}
                      className="text-xs h-8"
                      placeholder="Zip Code"
                    />
                  </div>
                </div>
              </div>

              {/* Social Media Section */}
              <div className="mt-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs text-gray-500">Social Media</h4>
                  <div className="h-px bg-gray-200 flex-grow mx-2"></div>
                </div>

                {/* Existing social media accounts */}
                {editedClient.socialMedia && editedClient.socialMedia.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {editedClient.socialMedia.map((social, index) => (
                      <div 
                        key={index} 
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-pink-50 border border-pink-100"
                      >
                        <span>{social.platform}: {social.handle}</span>
                        <button 
                          type="button"
                          onClick={() => removeSocialMedia(index)}
                          className="text-pink-400 hover:text-pink-700"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-5 gap-2">
                  <div className="col-span-2">
                    <select
                      value={socialPlatform}
                      onChange={(e) => setSocialPlatform(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors h-8 focus:outline-none focus:ring-1 focus:ring-pink-400"
                    >
                      <option value="">Select Platform</option>
                      <option value="IG">IG (Instagram)</option>
                      <option value="TT">TT (TikTok)</option>
                      <option value="FB">FB (Facebook)</option>
                      <option value="OTH">OTH (Other)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={socialHandle}
                      onChange={(e) => setSocialHandle(e.target.value)}
                      className="text-xs h-8"
                      placeholder="Handle (e.g. @username)"
                    />
                  </div>
                  <div>
                    <Button 
                      type="button"
                      onClick={addSocialMedia}
                      variant="outline"
                      className="w-full h-8 text-xs border-pink-200 text-pink-700 hover:bg-pink-50"
                      disabled={!socialPlatform || !socialHandle}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-pink-600 hover:bg-pink-700 text-xs h-8"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}