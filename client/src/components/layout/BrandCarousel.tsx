
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const carouselItems = [
  {
    title: "Why It Works—Because It's Real.",
    content: [
      "Because gift cards are obsolete.",
      "In a connected world, beauty should be personal, not plastic.",
      "Because men don't shop. They respond.",
      "Ven Me Baby is a gentle invitation to show he cares—with ease.",
      "Because she shouldn't have to ask twice.",
      "Now she doesn't. She chooses, he confirms, and the salon is booked."
    ]
  },
  {
    title: "What It Does:",
    content: [
      "✔️ Turns indecision into action",
      "✔️ Turns \"maybe later\" into prepaid now",
      "✔️ Eliminates no-shows with upfront commitment",
      "✔️ Connects directly to the client's real-life relationships"
    ]
  },
  {
    title: "Ven Me Baby is not a brand.",
    content: [
      "It's the beautiful middle between asking and ignoring,",
      "between forgetting and showing up.",
      "",
      "It's not a gift card.",
      "It's a gesture she initiates—and he finishes.",
      "It's attention, translated into care."
    ]
  },
  {
    title: "It's not a gift card.",
    content: [
      "It's a gesture she initiates—and he finishes.",
      "It's attention, translated into care."
    ]
  },
  {
    title: "For Those Who Know.",
    content: [
      "For Women Who Know.",
      "For Men Who Want to Get It Right.",
      "For Salons That Don't Have Time to Chase.",
      "This is the new standard.",
      "This is Ven Me Baby."
    ]
  }
];

export default function BrandCarousel() {
  return (
    <div className="py-3 relative max-w-3xl mx-auto">
      <Carousel
        opts={{
          align: "center",
          loop: true,
          slidesToScroll: 1,
          startIndex: 0,
        }}
        className="w-full relative"
      >
        <CarouselContent>
          {carouselItems.map((item, index) => (
            <CarouselItem key={index}>
              <div className="min-h-[500px] w-[90%] mx-auto p-6 rounded-2xl bg-gradient-to-br from-white via-white/95 to-pink-50/90 backdrop-blur-sm border border-pink-100 shadow-2xl hover:shadow-pink-100/20 transition-all flex flex-col justify-center">
                <h3 className="text-3xl font-semibold mb-8 text-[#FF92A5] leading-tight text-center">{item.title}</h3>
                <div className="space-y-6 flex-grow">
                  {item.content.map((line, i) => (
                    <p key={i} className={`text-lg text-gray-700 leading-[0.75] tracking-wide ${line.startsWith('Because') ? 'font-bold' : 'font-light'}`}>{line}</p>
                  ))}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute -left-12 bg-white hover:bg-pink-50 border-pink-100" />
        <CarouselNext className="absolute -right-12 bg-white hover:bg-pink-50 border-pink-100" />
      </Carousel>
    </div>
  );
}
