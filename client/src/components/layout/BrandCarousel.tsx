
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"

const carouselItems = [
  {
    title: "Why It Works—Because It's Real.",
    content: [
      "Because gift cards are obsolete.",
      "In a connected world, beauty should be personal, not plastic."
    ]
  },
  {
    title: "Because men don't shop. They respond.",
    content: [
      "Ven Me Baby is a gentle invitation to show he cares—with ease."
    ]
  },
  {
    title: "Because she shouldn't have to ask twice.",
    content: [
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
    <div className="py-12 bg-gradient-to-b from-pink-50/50 to-transparent">
      <Carousel
        opts={{
          align: "start",
          loop: true,
          skipSnaps: false,
          containScroll: "trimSnaps"
        }}
        className="w-full max-w-5xl mx-auto px-4"
      >
        <CarouselContent className="-ml-4">
          {carouselItems.map((item, index) => (
            <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
              <div className="h-[300px] p-6 rounded-lg bg-white/80 backdrop-blur-sm border border-pink-100 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-lg font-great-vibes mb-4 text-[#FF92A5]">{item.title}</h3>
                <div className="space-y-2">
                  {item.content.map((line, i) => (
                    <p key={i} className="text-sm text-gray-600 leading-relaxed">{line}</p>
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
