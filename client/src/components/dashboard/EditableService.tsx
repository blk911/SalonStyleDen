import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

// Service type definition
export interface ServiceData {
  id: number;
  name: string;
  description: string;
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

  // Handle save
  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // In a real app, this would be an API call
      await new Promise(r => setTimeout(r, 300)); // Simulate API call
      onSave(editedService);
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
      <div className={`border rounded p-2 ${service.featured ? 'border-pink-200 bg-pink-50' : 'border-gray-200'}`}>
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
    <Card className="border border-pink-300 shadow-sm p-2">
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