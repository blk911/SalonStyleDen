type HeroProps = {
  onSalonClick: () => void;
  onClientClick: () => void;
  salonName?: string;
  salonOwnerName?: string;
  ownerPhotoUrl?: string;
};

// Import the getImageUrl function from utils.ts
import { getImageUrl } from "@/lib/utils";
// Import VMB script logo directly from attached assets
import VmbScriptLogo from "@assets/VMB script logo.png";

export default function Hero({ 
  onSalonClick, 
  onClientClick, 
  salonName = "Ven Me, Baby!", 
  salonOwnerName = "Tiffany",
  ownerPhotoUrl 
}: HeroProps) {
  return (
    <section className="bg-gradient-to-b from-[#ffd8e6] to-white py-8 lg:py-10">
      {/* Only show photo for salon pages, not for home page */}
      {ownerPhotoUrl && (
        <div className="flex justify-center mb-4">
          <img 
            src={getImageUrl(ownerPhotoUrl)}
            alt={`${salonOwnerName}'s photo`}
            className="w-24 h-24 rounded-full object-cover border-2 border-[#FF92A5]"
            onError={(e) => {
              console.error("Error loading salon owner photo in Hero:", ownerPhotoUrl);
              e.currentTarget.src = '/assets/salon-card.png';
            }}
          />
        </div>
      )}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 text-center">
        <div className="flex justify-center mb-6">
          <h1 className="text-5xl md:text-[42px]">
            <span className="font-serif">Ven Me, </span>
            <span className="font-serif text-[#FF92A5]">Baby!</span>
          </h1>
        </div>
        <p className="text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Beauty doesn't wait! You choose the glam.
            <br />He gets a chance to shine!
            <br />Personal care gifting that works!
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