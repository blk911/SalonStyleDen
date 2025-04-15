import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPhoneNumber, getImageUrl } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
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
}

export default function EditableSalonInfo({ salon, onSave }: EditableSalonInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditVisible, setIsEditVisible] = useState(false); // Controls visibility of edit panel
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
      
      // Upload the file
      const response = await apiRequest<{filePath: string}>('/api/upload', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header for FormData
      });
      
      // Update the salon object with the new photo URL
      if (response && response.filePath) {
        setEditedSalon(prev => ({ 
          ...prev, 
          ownerPhotoUrl: response.filePath 
        }));
        
        toast({
          title: "Photo uploaded",
          description: "Your photo has been uploaded successfully.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive"
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
      // In a real app, this would be an API call
      await new Promise(r => setTimeout(r, 500)); // Simulate API call
      
      onSave(editedSalon);
      setIsEditing(false);
      // Also hide the edit panel when saving successfully
      setIsEditVisible(false);
    } catch (error) {
      console.error("Failed to update salon info:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Display mode (not editing)
  if (!isEditing) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-3 text-center">
          <div className="flex justify-between items-start mb-2">
            <div className="text-center w-full">
              <h3 className="font-semibold text-base text-pink-800 w-full text-center">{salon.name}</h3>
              <div className="flex flex-col items-center mt-2 gap-2">
                {salon.ownerPhotoUrl && (
                  <Avatar className="h-16 w-16 border-2 border-pink-100">
                    <AvatarImage src={getImageUrl(salon.ownerPhotoUrl)} alt={salon.ownerName} />
                    <AvatarFallback className="bg-pink-50 text-pink-500">
                      {salon.ownerName?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex items-center justify-center">
                  <p className="text-sm text-gray-600 font-medium">{salon.ownerName}</p>
                  <span className="text-xs text-gray-500 ml-1">• Owner</span>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs h-7 border-pink-200 text-pink-700 hover:bg-pink-50"
              onClick={() => setIsEditVisible(!isEditVisible)}
            >
              {isEditVisible ? "Hide Edit" : "Show Edit"}
            </Button>
          </div>
          
          {/* Show the Edit button below when isEditVisible is true */}
          {isEditVisible && (
            <div className="mt-3 mb-2">
              <Button
                variant="default"
                size="sm"
                className="bg-pink-500 hover:bg-pink-600 text-white text-xs"
                onClick={() => setIsEditing(true)}
              >
                Edit Salon Information
              </Button>
            </div>
          )}
          
          <div className="flex flex-col items-center gap-3 mt-3 text-sm">
            <div className="flex items-center gap-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="bg-pink-50 p-1.5 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
                <span className="text-gray-700">{salon.phone}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="bg-pink-50 p-1.5 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <span className="text-gray-700">{salon.email}</span>
              </div>
            </div>
            
            {salon.address && (
              <div className="flex items-center gap-2 justify-center mt-1">
                <div className="bg-pink-50 p-1.5 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 text-center">
                  {salon.address}
                  {(salon.city || salon.state || salon.zipCode) && (
                    <span>, {salon.city}{salon.city && salon.state ? ', ' : ''}{salon.state} {salon.zipCode}</span>
                  )}
                </span>
              </div>
            )}
          </div>
          
          {salon.socialMedia && salon.socialMedia.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-100">
              <div className="flex flex-wrap gap-2 justify-center">
                {salon.socialMedia.map((social, index) => (
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
        </CardContent>
      </Card>
    );
  }
  
  // Edit mode
  return (
    <Card className="shadow-sm">
      <CardContent className="p-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-sm">Edit Salon</h3>
          <div className="h-px bg-gray-200 flex-grow mx-2"></div>
        </div>
        
        {/* Owner Photo Upload Section */}
        <div className="mb-3 flex flex-col items-center">
          <div className="flex justify-between items-center w-full mb-2">
            <h4 className="text-xs text-gray-500">Owner Photo</h4>
            <div className="h-px bg-gray-200 flex-grow mx-2"></div>
          </div>
          
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16 border-2 border-pink-100">
              <AvatarImage src={getImageUrl(editedSalon.ownerPhotoUrl)} alt={editedSalon.ownerName} />
              <AvatarFallback className="bg-pink-50 text-pink-500">
                {editedSalon.ownerName?.substring(0, 2).toUpperCase()}
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
        
        {/* Action buttons */}
        <div className="flex justify-end gap-2 mt-3">
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs h-8"
            onClick={() => {
              setIsEditing(false);
              // Also hide the edit panel when canceling
              setIsEditVisible(false);
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
      </CardContent>
    </Card>
  );
}