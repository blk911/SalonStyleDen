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
    <section className="bg-gradient-to-b from-[#ffd8e6] to-white py-3 lg:py-3">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 text-center">
        <div className="flex justify-center mb-6">
          <h1 className="text-5xl md:text-[42px]">
            <span className="font-serif">Ven Me, </span>
            <span className="font-serif text-[#FF92A5]">Baby!</span>
          </h1>
        </div>
        <p className="text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Because beauty doesn't wait. Let her choose the glam.
          <br />LET HIM SAY YES
          <br />Welcome to the new standard in personal care gifting.
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