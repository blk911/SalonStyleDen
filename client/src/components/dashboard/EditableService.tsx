import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/lib/utils";

// Service type definition
export interface ServiceData {
  id: number;
  name: string;
  description: string;
  gifUrl?: string;
  price: number;
  duration: number; // in minutes
  featured: boolean;
}

interface EditableServiceProps {
  service: ServiceData;
  onSave: (updatedService: ServiceData) => void;
  onDelete?: (id: number) => void;
}

export default function EditableService({ service, onSave, onDelete }: EditableServiceProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedService, setEditedService] = useState<ServiceData>({ ...service });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle text input changes
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedService(prev => ({ ...prev, [name]: value }));
  };

  // Handle number input changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedService(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  // Toggle featured status
  const toggleFeatured = (featured: boolean) => {
    setEditedService(prev => ({ ...prev, featured }));
  };

  // Handle image upload
  const handleImageUpload = async (imageData: string): Promise<string | null> => {
    try {
      // Skip API call if the image hasn't changed (starts with http) or is empty
      if (!imageData || (imageData && (imageData.startsWith('http') || !imageData.startsWith('data:')))) {
        return imageData;
      }
      
      // Call our image upload API endpoint
      const response = await fetch('/api/images/service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData,
          serviceId: service.id,
          salonId: 1, // Use actual salon ID in production
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      console.log('Image upload response:', data);
      
      return data.imageUrl || null;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };
  
  // Handle save
  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Process image upload if there's a base64 image
      if (editedService.gifUrl && editedService.gifUrl.startsWith('data:')) {
        const uploadedImageUrl = await handleImageUpload(editedService.gifUrl);
        if (uploadedImageUrl) {
          setEditedService(prev => ({ ...prev, gifUrl: uploadedImageUrl }));
          // Save with the new URL
          onSave({
            ...editedService,
            gifUrl: uploadedImageUrl
          });
        } else {
          onSave(editedService);
        }
      } else {
        // No image to process, just save as is
        onSave(editedService);
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save style option:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (window.confirm("Are you sure you want to delete this style option?")) {
      try {
        // In a real app, this would be an API call
        await new Promise(r => setTimeout(r, 300)); // Simulate API call
        onDelete(service.id);
      } catch (error) {
        console.error("Failed to delete style option:", error);
      }
    }
  };

  // Display mode (not editing)
  if (!isEditing) {
    return (
      <div className={`border rounded px-2 py-3 ${service.featured ? 'border-pink-200 bg-pink-50' : 'border-gray-200'}`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-compact">{service.name}</h3>
            <p className="text-mini text-gray-600">{service.description}</p>
          </div>
          <div className="text-right">
            <span className="font-bold text-compact">${service.price.toFixed(2)}</span>
            <p className="text-micro">{service.duration} min</p>
          </div>
        </div>
        
        <div className="mt-3 mb-3 text-center">
          {service.name.toLowerCase().includes('french') || service.name.toLowerCase().includes('tips') ? (
            <img 
              src="/attached_assets/image_1744235634250.png" 
              alt={`${service.name} preview`} 
              className="inline-block rounded h-28 max-w-full object-contain mx-auto border border-pink-100"
            />
          ) : service.name.toLowerCase().includes('gel') || service.name.toLowerCase().includes('manicure') || service.name.toLowerCase().includes('lux') ? (
            <img 
              src="/attached_assets/image_1744235862752.png" 
              alt={`${service.name} preview`} 
              className="inline-block rounded h-28 max-w-full object-contain mx-auto border border-pink-100"
            />
          ) : service.name.toLowerCase().includes('sculpt') || service.name.toLowerCase().includes('acrylic') ? (
            <img 
              src="/attached_assets/image_1744235634250.png" 
              alt={`${service.name} preview`} 
              className="inline-block rounded h-28 max-w-full object-contain mx-auto border border-pink-100"
            />
          ) : service.name.toLowerCase().includes('glam') || service.name.toLowerCase().includes('custom') || service.name.toLowerCase().includes('design') ? (
            <img 
              src="/attached_assets/image_1744235862752.png" 
              alt={`${service.name} preview`} 
              className="inline-block rounded h-28 max-w-full object-contain mx-auto border border-pink-100"
            />
          ) : (
            <div className="h-28 w-full flex items-center justify-center border border-dashed border-gray-200 rounded bg-gray-50">
              <span className="text-xs text-gray-400">No image preview</span>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-1">
          {service.featured && (
            <Badge className="bg-[#FF92A5] text-white border-0 text-mini">
              Featured
            </Badge>
          )}
          <Button 
            variant="link" 
            className="text-micro text-pink-500 hover:text-pink-700 p-0 h-auto ml-auto"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <Card className="border border-pink-300 shadow-sm px-2 py-3">
      <h4 className="font-medium text-sm mb-2">Edit Style Option</h4>
      
      <div className="space-y-2">
        <div>
          <Label htmlFor="name" className="text-xs">Style Option Name</Label>
          <Input
            id="name"
            name="name"
            value={editedService.name}
            onChange={handleTextChange}
            className="text-xs h-8"
            placeholder="Style option name"
          />
        </div>
        
        <div>
          <Label htmlFor="description" className="text-xs">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={editedService.description}
            onChange={handleTextChange}
            className="text-xs min-h-[60px]"
            placeholder="Describe the style option"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="gifUrl" className="text-xs">Style Image Preview</Label>
          
          {/* Current Image Preview */}
          <div className="text-center">
            {editedService.name.toLowerCase().includes('french') || editedService.name.toLowerCase().includes('tips') ? (
              <div className="relative inline-block">
                <img 
                  src="/attached_assets/image_1744235634250.png" 
                  alt="Preview" 
                  className="h-28 max-w-full object-contain rounded border border-pink-100 mx-auto"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full bg-white/80 hover:bg-white text-gray-600"
                  onClick={() => setEditedService(prev => ({ ...prev, gifUrl: "" }))}
                >
                  ×
                </Button>
              </div>
            ) : editedService.name.toLowerCase().includes('gel') || editedService.name.toLowerCase().includes('manicure') || editedService.name.toLowerCase().includes('lux') ? (
              <div className="relative inline-block">
                <img 
                  src="/attached_assets/image_1744235862752.png" 
                  alt="Preview" 
                  className="h-28 max-w-full object-contain rounded border border-pink-100 mx-auto"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full bg-white/80 hover:bg-white text-gray-600"
                  onClick={() => setEditedService(prev => ({ ...prev, gifUrl: "" }))}
                >
                  ×
                </Button>
              </div>
            ) : editedService.name.toLowerCase().includes('sculpt') || editedService.name.toLowerCase().includes('acrylic') ? (
              <div className="relative inline-block">
                <img 
                  src="/attached_assets/image_1744235634250.png" 
                  alt="Preview" 
                  className="h-28 max-w-full object-contain rounded border border-pink-100 mx-auto"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full bg-white/80 hover:bg-white text-gray-600"
                  onClick={() => setEditedService(prev => ({ ...prev, gifUrl: "" }))}
                >
                  ×
                </Button>
              </div>
            ) : editedService.name.toLowerCase().includes('glam') || editedService.name.toLowerCase().includes('custom') || editedService.name.toLowerCase().includes('design') ? (
              <div className="relative inline-block">
                <img 
                  src="/attached_assets/image_1744235862752.png" 
                  alt="Preview" 
                  className="h-28 max-w-full object-contain rounded border border-pink-100 mx-auto"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full bg-white/80 hover:bg-white text-gray-600"
                  onClick={() => setEditedService(prev => ({ ...prev, gifUrl: "" }))}
                >
                  ×
                </Button>
              </div>
            ) : (
              <div className="h-28 w-full flex flex-col items-center justify-center border border-dashed border-gray-200 rounded bg-gray-50">
                <span className="text-xs text-gray-500">No image selected</span>
                <span className="text-xs text-gray-400 mt-1">Upload an image or enter URL below</span>
              </div>
            )}
          </div>
          
          {/* File Upload Input */}
          <div className="flex flex-col">
            <Label htmlFor="imageUpload" className="text-xs text-gray-600">Upload Image</Label>
            <Input
              id="imageUpload"
              type="file"
              accept="image/*"
              className="text-xs h-8 mt-1"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event: ProgressEvent<FileReader>) => {
                    const target = event.target as FileReader;
                    if (target && target.result) {
                      setEditedService(prev => ({ 
                        ...prev, 
                        gifUrl: target.result as string 
                      }));
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>
          
          {/* URL Input Option */}
          <div className="flex flex-col mt-2">
            <Label htmlFor="gifUrl" className="text-xs text-gray-600">Or Enter Image URL</Label>
            <Input
              id="gifUrl"
              name="gifUrl"
              value={editedService.gifUrl || ""}
              onChange={handleTextChange}
              className="text-xs h-8 mt-1"
              placeholder="https://example.com/image.gif"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="price" className="text-xs">Price ($)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={editedService.price}
              onChange={handleNumberChange}
              className="text-xs h-8"
            />
          </div>
          
          <div>
            <Label htmlFor="duration" className="text-xs">Duration (minutes)</Label>
            <Input
              id="duration"
              name="duration"
              type="number"
              min="5"
              step="5"
              value={editedService.duration}
              onChange={handleNumberChange}
              className="text-xs h-8"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch 
            id="featured"
            checked={editedService.featured}
            onCheckedChange={toggleFeatured}
            className="data-[state=checked]:bg-[#FF92A5]"
          />
          <Label htmlFor="featured" className="text-xs cursor-pointer">
            Featured style option (highlighted to clients)
          </Label>
        </div>
      </div>
      
      <div className="flex justify-between mt-3">
        <div>
          {onDelete && (
            <Button 
              variant="destructive" 
              size="sm"
              className="text-xs h-7"
              onClick={handleDelete}
            >
              Delete
            </Button>
          )}
        </div>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs h-7"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
          <Button 
            size="sm"
            className="bg-[#FF92A5] hover:bg-[#ff7a92] text-white text-xs h-7"
            disabled={isSubmitting}
            onClick={handleSave}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </Card>
  );
}