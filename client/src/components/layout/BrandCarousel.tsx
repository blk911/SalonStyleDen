
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Check } from "lucide-react";

const carouselItems = [
  {
    title: "👩‍💼 Here's How It Works:",
    content: [
      "Your client selects a curated service offer through your app, site, or QR in-salon.",
      "She sends it directly—to her partner, admirer, husband, whoever wants to say \"yes\" without guessing.",
      "He receives a beautifully worded message (crafted by us) and can pay in one tap.",
      "You receive confirmation and prepayment—no gift cards, no chasing, no \"she said he would.\""
    ]
  },
  {
    title: "💎 Why This Matters for You",
    content: [
      { text: "Prepaid Appointments", isBold: true, suffix: " = Revenue Locked In" },
      { text: "Clients Feel Seen", isBold: true, suffix: " + Empowered" },
      { text: "Men Get an Elegant Assist", isBold: true },
      { text: "You Become the Salon That \"Gets It\"", isBold: true }
    ]
  },
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
                <h3 className="text-4xl font-bold mb-8 text-[#FF92A5] leading-tight text-center">{item.title}</h3>
                <div className="space-y-6 flex-grow">
                  {item.content.map((line, i) => {
                    if (typeof line === 'string' && line.startsWith('✔️')) {
                      return (
                        <p key={i} className="text-lg text-gray-700 leading-normal tracking-wide flex items-center gap-2">
                          <Check className="h-5 w-5 text-green-500" strokeWidth={3} />
                          {line.replace('✔️', '')}
                        </p>
                      );
                    }
                    
                    if (line.includes('through your app')) {
                      return (
                        <p key={i} className="text-lg text-gray-700 leading-normal tracking-wide">
                          Your client selects a curated service offer <span className="font-bold">through your app, site, or QR in-salon.</span>
                        </p>
                      );
                    }
                    
                    if (line.includes('Prepaid Appointments')) {
                      return (
                        <p key={i} className="text-lg text-gray-700 leading-normal tracking-wide">
                          <span className="font-bold">Prepaid Appointments</span> = Revenue Locked In
                        </p>
                      );
                    }
                    
                    if (typeof line === 'object' && line.isBold) {
                      return (
                        <p key={i} className="text-lg text-gray-700 leading-normal tracking-wide">
                          <span className="font-bold">{line.text}</span>
                          {line.suffix}
                        </p>
                      );
                    }
                    return (
                      <p key={i} className="text-lg text-gray-700 leading-normal tracking-wide">
                        {line}
                      </p>
                    );
                  })}
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
