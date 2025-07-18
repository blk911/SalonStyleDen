import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPhoneNumber, getImageUrl, processApiUrl } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Social media item interface
export interface SocialMediaItem {
  platform: string;
  handle: string;
}

// Salon information interface
export interface SalonInfo {
  id: number;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  socialMedia?: SocialMediaItem[] | null;
  type?: string;
  ownerPhotoUrl?: string;
}

interface EditableSalonInfoProps {
  salon: SalonInfo;
  onSave: (updatedSalon: SalonInfo) => void;
  defaultEditing?: boolean;
}

export default function EditableSalonInfo({ salon, onSave, defaultEditing = false }: EditableSalonInfoProps) {
  // On salon dashboard, we always begin in "editable" mode, which shows the EDIT PROFILE button
  const [isEditing, setIsEditing] = useState(true); 
  // Only show the actual form when users click EDIT PROFILE
  const [showEditForm, setShowEditForm] = useState(false);
  const [editedSalon, setEditedSalon] = useState<SalonInfo>({ ...salon });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialPlatform, setSocialPlatform] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Social media platform options
  const platformOptions = ["Instagram", "Facebook", "Twitter", "TikTok", "Snapchat", "Pinterest"];

  // Handle basic input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Special handling for phone number formatting
    if (name === "phone") {
      setEditedSalon(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else {
      setEditedSalon(prev => ({ ...prev, [name]: value }));
    }
  };

  // Add a social media handle
  const addSocialMedia = () => {
    if (!socialPlatform || !socialHandle) return;

    const newSocialMedia = [
      ...(editedSalon.socialMedia || []),
      { platform: socialPlatform, handle: socialHandle }
    ];

    setEditedSalon(prev => ({ ...prev, socialMedia: newSocialMedia }));
    setSocialPlatform("");
    setSocialHandle("");
  };

  // Remove a social media handle
  const removeSocialMedia = (index: number) => {
    const newSocialMedia = [...(editedSalon.socialMedia || [])];
    newSocialMedia.splice(index, 1);
    setEditedSalon(prev => ({ ...prev, socialMedia: newSocialMedia }));
  };

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only accept image files
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload the file using fetch directly to ensure proper FormData handling
      console.log('Uploading salon owner photo:', file.name);
      
      const uploadResponse = await fetch(processApiUrl('/api/upload'), {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
      }
      
      const response = await uploadResponse.json();
      console.log('Photo upload response:', response);

      // Update the salon object with the new photo URL
      if (response && response.url) {
        // Store the raw URL, getImageUrl will handle cache busting when used
        const imageUrl = response.url;
        console.log('Set owner photo URL:', imageUrl);
        
        // Force invalidate any existing image cache
        if (typeof window !== 'undefined') {
          const img = new Image();
          img.src = getImageUrl(imageUrl) + '&nocache=' + Date.now();
        }
        
        // Update state with the new image URL
        setEditedSalon(prev => ({ 
          ...prev, 
          ownerPhotoUrl: imageUrl
        }));
        
        // Also update in database immediately to avoid losing the change
        try {
          console.log(`Saving owner photo URL directly to database: ${imageUrl}`);
          // Make API call to update just the photo URL using apiRequest
          const updatedSalon = await apiRequest(`/api/salons/${editedSalon.id}`, {
            method: 'PUT',
            data: {
              id: editedSalon.id,
              ownerPhotoUrl: imageUrl
            }
          });
          
          console.log('Owner photo URL updated in database:', updatedSalon.ownerPhotoUrl);
          // Invalidate React Query cache after photo upload
          await queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
          await queryClient.invalidateQueries({ queryKey: ['/api/salons', editedSalon.id.toString()] });
        } catch (err) {
          console.error('Error saving owner photo URL directly:', err);
          // Continue anyway as we've updated the local state
        }

        toast({
          title: "Photo uploaded",
          description: "Your photo has been uploaded successfully.",
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Trigger the file input click
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle form submission
  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Log what's being sent to the server for debugging
      console.log('Saving salon with data:', JSON.stringify(editedSalon, null, 2));
      console.log('Owner photo URL being saved:', editedSalon.ownerPhotoUrl);
      
      // Make a real API call to update the salon data using apiRequest
      const updatedSalon = await apiRequest(`/api/salons/${editedSalon.id}`, {
        method: 'PUT',
        data: editedSalon
      });
      
      console.log('Salon updated successfully through apiRequest:', updatedSalon);
      console.log('Returned owner photo URL:', updatedSalon.ownerPhotoUrl);
      
      // Invalidate React Query cache for salon data FIRST to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/salons', editedSalon.id.toString()] });
      
      // Remove any query parameters to clean up the URL without page reload
      if (window.history && window.location.search) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
      
      // Update the salon object in the parent component to reflect changes
      // AFTER the cache has been invalidated
      onSave({
        ...updatedSalon,
        // Ensure the ownerPhotoUrl is properly set even if the server didn't return it
        ownerPhotoUrl: updatedSalon.ownerPhotoUrl || editedSalon.ownerPhotoUrl
      });
      
      // Exit edit mode and form display
      setIsEditing(false);
      setShowEditForm(false);
      
      toast({
        title: "Successfully updated salon profile",
        description: "Your changes have been saved.",
        duration: 3000
      });

      // Force any cached images to reload
      if (updatedSalon.ownerPhotoUrl) {
        const timestamp = Date.now();
        const cachedImageUrl = getImageUrl(updatedSalon.ownerPhotoUrl) + `?t=${timestamp}`;
        // Preload the image
        const img = new Image();
        img.src = cachedImageUrl;
      }
    } catch (error) {
      console.error("Failed to update salon info:", error);
      toast({
        title: "Error updating salon",
        description: error instanceof Error ? error.message : "Failed to update salon information",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Removed non-editing display mode - we'll always start in "editable" summary view mode
  // with EDIT PROFILE button displayed. This ensures consistency in dashboard behavior.

  // Edit mode
  return (
    <Card className="shadow-sm">
      <CardContent className="p-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-sm">Edit Salon</h3>
          <div className="h-px bg-gray-200 flex-grow mx-2"></div>
          
          {!showEditForm && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-7 bg-pink-100 border-pink-200 text-pink-700 hover:bg-pink-200"
              onClick={() => setShowEditForm(true)}
            >
              EDIT PROFILE
            </Button>
          )}
        </div>

        {/* View only in edit mode until EDIT PROFILE is clicked */}
        {!showEditForm ? (
          <div className="mb-3 flex flex-col items-center">
            <div className="flex items-center gap-3 justify-center">
              <Avatar className="h-16 w-16 border-2 border-pink-100">
                <AvatarImage 
                  src={editedSalon.ownerPhotoUrl ? getImageUrl(editedSalon.ownerPhotoUrl) : '/assets/salon-card.png'}
                  alt={editedSalon.ownerName}
                  onError={(e) => {
                    console.error("Error loading avatar image in edit mode");
                    console.log("Attempted to load:", editedSalon.ownerPhotoUrl ? getImageUrl(editedSalon.ownerPhotoUrl) : 'default image');
                    e.currentTarget.src = '/assets/salon-card.png';
                  }} 
                />
                <AvatarFallback className="bg-pink-50 text-pink-500">
                  {editedSalon.ownerName?.substring(0, 2)?.toUpperCase() || 'OW'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex flex-col gap-1 items-start">
                <div className="text-sm font-medium">{editedSalon.name}</div>
                <div className="text-xs text-gray-600">{editedSalon.ownerName} • Owner</div>
                <div className="text-xs text-gray-600">{editedSalon.phone}</div>
                <div className="text-xs text-gray-600">{editedSalon.email}</div>
              </div>
            </div>
            
            {editedSalon.address && (
              <div className="mt-3 text-xs text-gray-600 text-center">
                {editedSalon.address}
                {(editedSalon.city || editedSalon.state || editedSalon.zipCode) && (
                  <span>, {editedSalon.city}{editedSalon.city && editedSalon.state ? ', ' : ''}{editedSalon.state} {editedSalon.zipCode}</span>
                )}
              </div>
            )}
            
            {editedSalon.socialMedia && editedSalon.socialMedia.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-100 w-full">
                <div className="flex flex-wrap gap-2 justify-center">
                  {editedSalon.socialMedia.map((social, index) => (
                    <div 
                      key={index} 
                      className="flex items-center px-2 py-1 rounded bg-pink-50 text-xs text-pink-700"
                    >
                      <span className="font-medium">{social.platform}</span>
                      <span className="mx-1">•</span>
                      <span>{social.handle}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Owner Photo Upload Section - only shown when EDIT PROFILE is clicked */}
            <div className="mb-3 flex flex-col items-center">
              <div className="flex justify-between items-center w-full mb-2">
                <h4 className="text-xs text-gray-500">Owner Photo</h4>
                <div className="h-px bg-gray-200 flex-grow mx-2"></div>
              </div>

              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16 border-2 border-pink-100">
                  <AvatarImage 
                    src={editedSalon.ownerPhotoUrl ? getImageUrl(editedSalon.ownerPhotoUrl) : '/assets/salon-card.png'}
                    alt={editedSalon.ownerName}
                    onError={(e) => {
                      console.error("Error loading avatar image in edit mode");
                      console.log("Attempted to load:", editedSalon.ownerPhotoUrl ? getImageUrl(editedSalon.ownerPhotoUrl) : 'default image');
                      e.currentTarget.src = '/assets/salon-card.png';
                    }} 
                  />
                  <AvatarFallback className="bg-pink-50 text-pink-500">
                    {editedSalon.ownerName?.substring(0, 2)?.toUpperCase() || 'OW'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col gap-1">
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={triggerFileUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Upload Photo'}
                  </Button>
                  <p className="text-xs text-gray-500">JPG, PNG, or GIF (max 2MB)</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoUpload} 
                    className="hidden" 
                    accept="image/*"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Only show the form fields if showEditForm is true */}
        {showEditForm && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    id="name"
                    name="name"
                    value={editedSalon.name}
                    onChange={handleChange}
                    className="text-xs h-8"
                    placeholder="Salon Name"
                  />
                </div>

                <div>
                  <Input
                    id="ownerName"
                    name="ownerName"
                    value={editedSalon.ownerName}
                    onChange={handleChange}
                    className="text-xs h-8"
                    placeholder="Owner Name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    id="phone"
                    name="phone"
                    value={editedSalon.phone}
                    onChange={handleChange}
                    className="text-xs h-8"
                    placeholder="Phone Number"
                  />
                </div>

                <div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={editedSalon.email}
                    onChange={handleChange}
                    className="text-xs h-8"
                    placeholder="Email Address"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <Input
                  id="address"
                  name="address"
                  value={editedSalon.address || ''}
                  onChange={handleChange}
                  className="text-xs h-8"
                  placeholder="Street Address (123 Main Street)"
                />
              </div>

              <div>
                <Input
                  id="city"
                  name="city"
                  value={editedSalon.city || ''}
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
                    value={editedSalon.state || ''}
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
                    value={editedSalon.zipCode || ''}
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
              {editedSalon.socialMedia && editedSalon.socialMedia.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {editedSalon.socialMedia.map((social, index) => (
                    <div 
                      key={index} 
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-pink-50 border border-pink-100"
                    >
                      <span>{social.platform}: {social.handle}</span>
                      <button 
                        type="button"
                        onClick={() => removeSocialMedia(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new social media */}
              <div className="flex gap-1 items-end">
                <div className="flex-1">
                  <select
                    id="socialPlatform"
                    value={socialPlatform}
                    onChange={(e) => setSocialPlatform(e.target.value)}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs h-8"
                  >
                    <option value="">Social Platform</option>
                    {platformOptions.map(platform => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1">
                  <Input
                    id="socialHandle"
                    value={socialHandle}
                    onChange={(e) => setSocialHandle(e.target.value)}
                    className="text-xs h-8"
                    placeholder="@username"
                  />
                </div>

                <Button 
                  type="button"
                  size="sm"
                  className="h-8 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs"
                  onClick={addSocialMedia}
                  disabled={!socialPlatform || !socialHandle}
                >
                  Add
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Action buttons - only show when the form fields are displayed */}
        {showEditForm && (
          <div className="flex justify-end gap-2 mt-3">
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs h-8"
              onClick={() => {
                setShowEditForm(false);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              size="sm"
              className="bg-[#FF92A5] hover:bg-[#ff7a92] text-white text-xs h-8"
              disabled={isSubmitting}
              onClick={handleSave}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
        
        {/* Removed Back button since we always stay in edit mode now 
           and only toggle between showing the form or not */}
      </CardContent>
    </Card>
  );
}
