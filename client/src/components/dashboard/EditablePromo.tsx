import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

// Promo type definition
export interface PromoData {
  id: number;
  title: string;
  description: string;
  endDate: string | null; // null means ongoing
}

interface EditablePromoProps {
  promo: PromoData;
  onSave: (updatedPromo: PromoData) => void;
  onDelete?: (id: number) => void;
}

export default function EditablePromo({ promo, onSave, onDelete }: EditablePromoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPromo, setEditedPromo] = useState<PromoData>({ ...promo });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEndDateEnabled, setIsEndDateEnabled] = useState(!!promo.endDate);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedPromo(prev => ({ ...prev, [name]: value }));
  };

  // Toggle end date on/off
  const toggleEndDate = () => {
    setIsEndDateEnabled(!isEndDateEnabled);
    if (!isEndDateEnabled) {
      // If enabling, set a default date 30 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      setEditedPromo(prev => ({
        ...prev,
        endDate: defaultDate.toISOString().split('T')[0]
      }));
    } else {
      // If disabling, set to null (ongoing)
      setEditedPromo(prev => ({ ...prev, endDate: null }));
    }
  };

  // Handle save
  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // In a real app, this would be an API call
      await new Promise(r => setTimeout(r, 300)); // Simulate API call
      
      // Prepare the final promo data
      const finalPromo = {
        ...editedPromo,
        endDate: isEndDateEnabled ? editedPromo.endDate : null
      };
      
      // Call the onSave callback
      onSave(finalPromo);
      
      // Exit edit mode
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save promo:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (window.confirm("Are you sure you want to delete this promotion?")) {
      try {
        // In a real app, this would be an API call
        await new Promise(r => setTimeout(r, 300)); // Simulate API call
        onDelete(promo.id);
      } catch (error) {
        console.error("Failed to delete promo:", error);
      }
    }
  };

  // Display mode (not editing)
  if (!isEditing) {
    return (
      <div className="border border-pink-100 rounded overflow-hidden shadow-sm h-auto">
        <div className="h-32 flex items-center justify-center">
          {promo.title.toLowerCase().includes('summer') ? (
            <img 
              src="/assets/summer-french-tips.png" 
              alt={promo.title}
              className="w-full h-full object-cover"
            />
          ) : promo.title.toLowerCase().includes('new client') ? (
            <img 
              src="/assets/spring-lavender.png" 
              alt={promo.title}
              className="w-full h-full object-cover"
            />
          ) : promo.title.toLowerCase().includes('friend') || promo.title.toLowerCase().includes('bff') || promo.title.toLowerCase().includes('bring') ? (
            <img 
              src="/assets/bff-promo.png" 
              alt={promo.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="bg-[#FEE1E8] h-full w-full flex items-center justify-center">
              <span className="font-medium text-compact text-center px-1">{promo.title}</span>
            </div>
          )}
        </div>
        <div className="card-content p-2">
          <h4 className="font-medium text-compact text-center">{promo.title}</h4>
          <p className="text-mini text-gray-600 text-center">{promo.description}</p>
          <div className="flex justify-between items-center vspace-xs mt-2">
            <span className="text-micro">
              {promo.endDate ? `Ends: ${new Date(promo.endDate).toLocaleDateString()}` : 'Ongoing'}
            </span>
            <Button 
              variant="link" 
              className="text-micro text-pink-500 hover:text-pink-700 p-0 h-auto"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <Card className="border border-pink-300 shadow-sm p-2">
      <h4 className="font-medium text-sm mb-2">Edit Promotion</h4>
      
      <div className="space-y-2">
        <div>
          <Label htmlFor="title" className="text-xs">Title</Label>
          <Input
            id="title"
            name="title"
            value={editedPromo.title}
            onChange={handleChange}
            className="text-xs h-8"
            placeholder="Promotion title"
          />
        </div>
        
        <div>
          <Label htmlFor="description" className="text-xs">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={editedPromo.description}
            onChange={handleChange}
            className="text-xs min-h-[60px]"
            placeholder="Describe your promotion"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="hasEndDate" 
            checked={isEndDateEnabled}
            onChange={toggleEndDate}
            className="h-3 w-3"
          />
          <Label htmlFor="hasEndDate" className="text-xs cursor-pointer">Has end date</Label>
        </div>
        
        {isEndDateEnabled && (
          <div>
            <Label htmlFor="endDate" className="text-xs">End Date</Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={editedPromo.endDate || ''}
              onChange={handleChange}
              className="text-xs h-8"
            />
          </div>
        )}
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