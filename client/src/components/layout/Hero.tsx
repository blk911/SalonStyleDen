type HeroProps = {
  onSalonClick?: () => void;
  onClientClick?: () => void;
  salonName?: string;
  salonOwnerName?: string;
  ownerPhotoUrl?: string;
  hideButtons?: boolean;
  subtitle?: string;
};

// Import the getImageUrl function from utils.ts
import { getImageUrl } from "@/lib/utils";

export default function Hero({ 
  onSalonClick, 
  onClientClick, 
  salonName = "Ven Me, Baby!", 
  salonOwnerName = "Tiffany",
  ownerPhotoUrl,
  hideButtons = false,
  subtitle = "Empowering. Personal. Connection."
}: HeroProps) {
  return (
    <section className="bg-gradient-to-b from-[#ffd8e6] to-white py-6 border-b border-pink-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {ownerPhotoUrl && (
          <div className="flex justify-center mb-4">
            <img 
              src={getImageUrl(ownerPhotoUrl)}
              alt={`${salonOwnerName}'s photo`}
              className="w-24 h-24 rounded-full object-cover border-2 border-[#FF92A5]"
              onError={(e) => {
                console.error("Error loading owner photo in hero:", ownerPhotoUrl);
                e.currentTarget.src = '/assets/salon-card.png';
              }}
            />
          </div>
        )}
        
        <div className="font-serif">
          <span className="text-4xl font-normal text-black">Ven Me, </span>
          <span className="text-4xl font-normal italic text-[#FF92A5]">Baby!</span>
        </div>
        
        <p className="text-gray-700 text-base mt-2">{subtitle}</p>
        
        {!hideButtons && (
          <div className="flex justify-center gap-4 flex-wrap">
            <button
              onClick={onSalonClick}
              className="bg-[#FF92A5] hover:bg-[#E57C8E] text-white font-medium py-2 px-6 rounded-lg transition duration-300 transform hover:scale-105 shadow-md"
            >
              I'm a Salon Owner
            </button>
            <button
              onClick={onClientClick}
              className="bg-white hover:bg-gray-50 text-[#FF92A5] border-2 border-[#FF92A5] font-medium py-2 px-6 rounded-lg transition duration-300 transform hover:scale-105 shadow-md"
            >
              I'm a Client
            </button>
          </div>
        )}
      </div>
    </section>
  );
}