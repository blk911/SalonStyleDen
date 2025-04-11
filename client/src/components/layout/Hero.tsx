type HeroProps = {
  onSalonClick: () => void;
  onClientClick: () => void;
  salonName?: string;
  salonOwnerName?: string;
};

export default function Hero({ 
  onSalonClick, 
  onClientClick, 
  salonName = "Ven Me, Baby!", 
  salonOwnerName = "Tiffany" 
}: HeroProps) {
  return (
    <section className="bg-[#FEE1E8] py-6 lg:py-10">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 text-center">
        <p>{salonName}</p>
        <p>Welcome to <strong>Ven Me, Baby!</strong> Gifting made easy!</p>
        <p>You get glam'd, he gets to show you the love! or not?</p>
        <div className="mt-6">
          <p className="font-bold text-xl mb-2">Register Now</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
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
      </div>
    </section>
  );
}