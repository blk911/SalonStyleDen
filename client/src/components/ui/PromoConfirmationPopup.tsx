import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';

interface Promo {
  id: number;
  title: string;
  description: string;
  endDate?: string | undefined | null;
}

interface PromoConfirmationPopupProps {
  promo: Promo | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PromoConfirmationPopup({ promo, isOpen, onClose }: PromoConfirmationPopupProps) {
  if (!promo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg text-[#FF92A5]">Promotion Selected!</DialogTitle>
          <DialogDescription className="text-center text-sm text-gray-600">
            Confirmation of your promotion selection.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckIcon className="h-8 w-8 text-green-600" />
          </div>
          
          <div className="text-center px-4">
            <h3 className="font-bold text-lg">{promo.title}</h3>
            <p className="text-base mt-2">{promo.description}</p>
            <p className="text-sm mt-4 text-gray-500">
              Thank you for selecting this promotion! It has been added to your account.
            </p>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-center">
          <Button 
            onClick={onClose}
            className="bg-[#FF92A5] hover:bg-[#ff7a92] text-white"
          >
            Continue Shopping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}