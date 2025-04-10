import { Button } from "@/components/ui/button";

type SocialMedia = {
  platform: string;
  handle: string;
};

type VerificationModalProps = {
  data: any;
  type: "salon" | "client";
  onConfirm: (data: any) => void;
  onEdit: () => void;
};

export default function VerificationModal({ data, type, onConfirm, onEdit }: VerificationModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
        <h3 className="font-playfair font-bold text-xl mb-4">Verify Your Information</h3>
        
        <div className="text-sm space-y-3 max-h-60 overflow-y-auto mb-6">
          <dl className="grid grid-cols-3 gap-y-2">
            {type === "salon" ? (
              <>
                <dt className="col-span-1 font-medium">Salon Name:</dt>
                <dd className="col-span-2">{data.salonName}</dd>
                
                <dt className="col-span-1 font-medium">Owner:</dt>
                <dd className="col-span-2">{data.ownerName}</dd>
                
                <dt className="col-span-1 font-medium">Phone:</dt>
                <dd className="col-span-2">{data.phone}</dd>
                
                <dt className="col-span-1 font-medium">Email:</dt>
                <dd className="col-span-2">{data.email}</dd>
                
                {/* Social media */}
                {(data.instagram || data.facebook || data.tiktok || data.pinterest) && (
                  <>
                    <dt className="col-span-1 font-medium">Social Media:</dt>
                    <dd className="col-span-2">
                      {data.instagram && data.instagramHandle && <div>Instagram: {data.instagramHandle}</div>}
                      {data.facebook && data.facebookHandle && <div>Facebook: {data.facebookHandle}</div>}
                      {data.tiktok && data.tiktokHandle && <div>TikTok: {data.tiktokHandle}</div>}
                      {data.pinterest && data.pinterestHandle && <div>Pinterest: {data.pinterestHandle}</div>}
                    </dd>
                  </>
                )}
              </>
            ) : (
              <>
                <dt className="col-span-1 font-medium">Name:</dt>
                <dd className="col-span-2">{data.name}</dd>
                
                <dt className="col-span-1 font-medium">Phone:</dt>
                <dd className="col-span-2">{data.phone}</dd>
                
                <dt className="col-span-1 font-medium">Email:</dt>
                <dd className="col-span-2">{data.email}</dd>
                
                <dt className="col-span-1 font-medium">Current Client:</dt>
                <dd className="col-span-2">{data.isCurrentClient === "yes" ? "Yes" : "No"}</dd>
                
                {/* Show salon information */}
                <dt className="col-span-1 font-medium">Salon:</dt>
                <dd className="col-span-2">
                  {data.salonName || (data.salonId ? `Salon #${data.salonId}` : "Ven Me, Baby! Lux")}
                </dd>
                
                {/* Notes if any */}
                {data.notes && (
                  <>
                    <dt className="col-span-1 font-medium">Notes:</dt>
                    <dd className="col-span-2">{data.notes}</dd>
                  </>
                )}
                
                {/* Favorite services */}
                {data.favoriteServices && data.favoriteServices.length > 0 && (
                  <>
                    <dt className="col-span-1 font-medium">Favorite Services:</dt>
                    <dd className="col-span-2">
                      <div className="flex flex-wrap gap-1">
                        {data.favoriteServices.map((service: string) => (
                          <span 
                            key={service} 
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-pink-50 text-pink-600 border border-pink-100"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </dd>
                  </>
                )}
              </>
            )}
          </dl>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
          <Button 
            variant="outline" 
            onClick={onEdit}
            className="border border-[#FF92A5] text-[#FF92A5] hover:bg-[#FEE1E8]"
          >
            Edit
          </Button>
          <Button 
            onClick={() => onConfirm(data)}
            className="bg-[#FF92A5] hover:bg-[#E57C8E]"
          >
            Confirm & Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
