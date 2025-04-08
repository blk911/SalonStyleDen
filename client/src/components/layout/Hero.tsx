type HeroProps = {
  onSalonClick: () => void;
  onClientClick: () => void;
};

export default function Hero({ onSalonClick, onClientClick }: HeroProps) {
  return (
    <section className="bg-[#FEE1E8] py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-playfair font-bold text-4xl md:text-5xl lg:text-6xl text-gray-900 leading-tight">
          Where Beauty Meets <span className="text-[#FF92A5]">Expertise</span>
        </h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Discover a sanctuary where style is personalized and beauty is celebrated. Your journey to stunning hair begins here.
        </p>
        <div className="mt-10">
          <p className="font-bold text-xl mb-4">Register Now</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={onSalonClick}
              className="bg-[#FF92A5] hover:bg-[#E57C8E] text-white font-medium py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105 shadow-md"
            >
              I'm a Salon Owner
            </button>
            <button
              onClick={onClientClick}
              className="bg-white hover:bg-gray-50 text-[#FF92A5] border-2 border-[#FF92A5] font-medium py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105 shadow-md"
            >
              I'm a Client
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
