import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Promo {
  id: number;
  title: string;
  description: string;
  endDate?: string | undefined | null;
}

interface PromoDetailsPopupProps {
  promo: Promo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function PromoDetailsPopup({ promo, isOpen, onClose, onSave }: PromoDetailsPopupProps) {
  if (!promo) return null;

  const getPromoImage = (title: string): string | undefined => {
    if (title.toLowerCase().includes('summer') || title.toLowerCase().includes('french')) {
      return "/assets/french-tips.png";
    } else if (title.toLowerCase().includes('new client') || title.toLowerCase().includes('spring')) {
      return "/assets/gel-manicure.png";
    } else if (title.toLowerCase().includes('friend') || title.toLowerCase().includes('bff') || title.toLowerCase().includes('bring')) {
      return "/assets/BRING_FRIEND_2.JPG";
    }
    return undefined;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold text-[#FF92A5]">{promo.title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          {getPromoImage(promo.title) ? (
            <div className="h-48 w-full overflow-hidden rounded-md">
              <img 
                src={getPromoImage(promo.title) || '/assets/LOGO1.png'} 
                alt={promo.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error(`Failed to load image for promo: ${promo.title}`);
                  e.currentTarget.src = '/assets/LOGO1.png';
                }}
              />
            </div>
          ) : (
            <div className="h-48 w-full bg-[#FEE1E8] flex items-center justify-center rounded-md">
              <span className="font-medium text-lg text-center px-4">{promo.title}</span>
            </div>
          )}
          
          <div className="text-center px-4">
            <p className="text-base">{promo.description}</p>
            <p className="text-sm mt-2 text-gray-500">
              {promo.endDate ? `Offer ends: ${new Date(promo.endDate).toLocaleDateString()}` : 'Ongoing promotion'}
            </p>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-center gap-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-[#FF92A5] text-[#FF92A5] hover:bg-pink-50"
          >
            Back
          </Button>
          <Button 
            onClick={onSave}
            className="bg-[#FF92A5] hover:bg-[#ff7a92] text-white"
          >
            Select This Promo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}