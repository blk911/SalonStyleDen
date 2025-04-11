
import { Link } from "wouter";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

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
    title: "This Is Luxury That Moves.",
    content: [
      "Not loud. Not flashy.",
      "But intimate. Timed.",
      "Undeniably modern.",
      "And always prepaid."
    ]
  },
  {
    title: "Ven Me Baby is not a brand.",
    content: [
      "It's the beautiful middle between asking and ignoring,",
      "between forgetting and showing up."
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
    <div className="py-16 bg-gradient-to-b from-pink-50/50 to-transparent">
      <Carousel
        opts={{
          align: "start",
          loop: true,
          skipSnaps: false,
          containScroll: "trimSnaps"
        }}
        className="w-full max-w-6xl mx-auto px-4"
      >
        <CarouselContent className="-ml-4">
          {carouselItems.map((item, index) => (
            <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
              <div className="min-h-[400px] p-8 rounded-xl bg-white/90 backdrop-blur-sm border border-pink-100 shadow-lg hover:shadow-xl transition-all flex flex-col">
                <h3 className="text-2xl font-great-vibes mb-6 text-[#FF92A5] leading-relaxed">{item.title}</h3>
                <div className="space-y-4 flex-grow">
                  {item.content.map((line, i) => (
                    <p key={i} className="text-base text-gray-700 leading-relaxed font-light">{line}</p>
                  ))}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
