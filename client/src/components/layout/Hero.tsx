type HeroProps = {
  onSalonClick: () => void;
  onClientClick: () => void;
  salonName?: string;
  salonOwnerName?: string;
  ownerPhotoUrl?: string;
};

// Import the getImageUrl function from utils.ts
import { getImageUrl } from "@/lib/utils";

export default function Hero({ 
  onSalonClick, 
  onClientClick, 
  salonName = "Ven Me, Baby!", 
  salonOwnerName = "Tiffany",
  ownerPhotoUrl 
}: HeroProps) {
  return (
    <section className="bg-gradient-to-b from-[#ffd8e6] to-white py-3 lg:py-3">
      <div className="flex justify-center mb-4">
        {/* Only show image if owner photo is provided (for salon pages) */}
        {ownerPhotoUrl && (
          // For salon owner pages
          <img 
            src={getImageUrl(ownerPhotoUrl)}
            alt={`${salonOwnerName}'s photo`}
            className="w-24 h-24 rounded-full object-cover border-2 border-[#FF92A5]"
            onError={(e) => {
              console.error("Error loading salon owner photo in Hero:", ownerPhotoUrl);
              // Use salon-specific fallback, not VMB logo
              e.currentTarget.src = '/assets/salon-card.png';
            }}
          />
        )}
      </div>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 text-center">
        <div className="flex justify-center mb-6">
          <h1 className="text-5xl md:text-[42px]">
            <span className="logo">
              Ven Me, <span className="text-[#FF92A5]">Baby!</span>
            </span>
          </h1>
        </div>
        <p className="text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            <i>The perfect gift is perfectly timed!</i>
          </p>
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
      </div>
    </section>
  );
}