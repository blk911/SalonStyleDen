import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatPhoneNumber } from "@/lib/utils";

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
}

interface EditableSalonInfoProps {
  salon: SalonInfo;
  onSave: (updatedSalon: SalonInfo) => void;
}

export default function EditableSalonInfo({ salon, onSave }: EditableSalonInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSalon, setEditedSalon] = useState<SalonInfo>({ ...salon });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialPlatform, setSocialPlatform] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  
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
  
  // Handle form submission
  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // In a real app, this would be an API call
      await new Promise(r => setTimeout(r, 500)); // Simulate API call
      
      onSave(editedSalon);
      setIsEditing(false);
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
        <CardContent className="p-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-sm">Salon Information</h3>
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs h-7 border-pink-200 text-pink-700 hover:bg-pink-50"
              onClick={() => setIsEditing(true)}
            >
              Edit Information
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs">
            <div>
              <span className="font-medium">Name:</span> {salon.name}
            </div>
            <div>
              <span className="font-medium">Owner:</span> {salon.ownerName}
            </div>
            <div>
              <span className="font-medium">Phone:</span> {salon.phone}
            </div>
            <div>
              <span className="font-medium">Email:</span> {salon.email}
            </div>
            {salon.address && (
              <div>
                <span className="font-medium">Address:</span> {salon.address}
              </div>
            )}
            {(salon.city || salon.state || salon.zipCode) && (
              <div>
                <span className="font-medium">Location:</span> 
                {salon.city}{salon.city && salon.state ? ', ' : ''}{salon.state} {salon.zipCode}
              </div>
            )}
          </div>
          
          {salon.socialMedia && salon.socialMedia.length > 0 && (
            <div className="mt-2">
              <h4 className="text-xs font-medium">Social Media</h4>
              <div className="flex flex-wrap gap-1 mt-1">
                {salon.socialMedia.map((social, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-pink-50 border border-pink-100"
                  >
                    {social.platform}: {social.handle}
                  </span>
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
        <h3 className="font-medium text-sm mb-2">Edit Salon Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <Label htmlFor="name" className="text-xs">Salon Name</Label>
            <Input
              id="name"
              name="name"
              value={editedSalon.name}
              onChange={handleChange}
              className="text-xs h-8"
            />
          </div>
          
          <div>
            <Label htmlFor="ownerName" className="text-xs">Owner Name</Label>
            <Input
              id="ownerName"
              name="ownerName"
              value={editedSalon.ownerName}
              onChange={handleChange}
              className="text-xs h-8"
            />
          </div>
          
          <div>
            <Label htmlFor="phone" className="text-xs">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              value={editedSalon.phone}
              onChange={handleChange}
              className="text-xs h-8"
              placeholder="(123) 456-7890"
            />
          </div>
          
          <div>
            <Label htmlFor="email" className="text-xs">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={editedSalon.email}
              onChange={handleChange}
              className="text-xs h-8"
            />
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="address" className="text-xs">Street Address</Label>
            <Input
              id="address"
              name="address"
              value={editedSalon.address || ''}
              onChange={handleChange}
              className="text-xs h-8"
              placeholder="123 Main Street"
            />
          </div>
          
          <div>
            <Label htmlFor="city" className="text-xs">City</Label>
            <Input
              id="city"
              name="city"
              value={editedSalon.city || ''}
              onChange={handleChange}
              className="text-xs h-8"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="state" className="text-xs">State</Label>
              <Input
                id="state"
                name="state"
                value={editedSalon.state || ''}
                onChange={handleChange}
                className="text-xs h-8"
                placeholder="CA"
                maxLength={2}
              />
            </div>
            
            <div>
              <Label htmlFor="zipCode" className="text-xs">Zip Code</Label>
              <Input
                id="zipCode"
                name="zipCode"
                value={editedSalon.zipCode || ''}
                onChange={handleChange}
                className="text-xs h-8"
                placeholder="12345"
              />
            </div>
          </div>
        </div>
        
        {/* Social Media Section */}
        <div className="mt-3">
          <h4 className="text-xs font-medium mb-1">Social Media Accounts</h4>
          
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
              <Label htmlFor="socialPlatform" className="text-xs">Platform</Label>
              <select
                id="socialPlatform"
                value={socialPlatform}
                onChange={(e) => setSocialPlatform(e.target.value)}
                className="w-full border border-gray-200 rounded px-2 py-1 text-xs h-8"
              >
                <option value="">Select Platform</option>
                {platformOptions.map(platform => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <Label htmlFor="socialHandle" className="text-xs">Username/Handle</Label>
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
            onClick={() => setIsEditing(false)}
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