import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Check } from "lucide-react";
import { ReactNode } from "react";

type ContentItem =
  | string
  | { text: string; isBold: boolean; suffix?: string }
  | Array<{ text: string; isBold: boolean }>
  | string[];

type CarouselItemType = {
  title: string;
  content: ContentItem[];
};

const carouselItems: CarouselItemType[] = [
  {
    title: "👩‍💼 Here's How It Works:",
    content: [
      { text: "Your client selects a curated service offer", isBold: true, suffix: " through your app, site, or QR in-salon." },
      { text: "She sends it directly", isBold: true, suffix: "—to her partner, admirer, husband, whoever wants to say \"yes\" without guessing." },
      { text: "He recieves your Ven Me, Baby! gift request,", isBold: true, suffix: " timing is everything, she is booked, but has an opening, you are thinking about him, now thinking about YOU!" },
      { text: "He can be a HERO!", isBold: true, suffix: " Select the pay method, hit enter, be a HERO! It meets your customer, over there, on their phone...in their life!" },
      { text: "You receive confirmation and prepayment", isBold: true, suffix: "—no gift cards, no chasing, no \"she said he would.\"" }
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
      [
        { text: "Because perfect timing is everything.", isBold: true },
        { text: "She's thinking of you, has an opening today, and knows exactly what she wants.", isBold: false }
      ],
      [
        { text: "Because connection matters more than convenience.", isBold: true },
        { text: "A Ven Me Baby request shows you're in each other's thoughts.", isBold: false }
      ],
      [
        { text: "Because spontaneous care speaks volumes.", isBold: true },
        { text: "She's ready, you're thoughtful, and her appointment is secured.", isBold: false }
      ]
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
      ["It's the ", "beautiful middle", " between asking and ignoring,"],
      ["", "between forgetting", " and showing up."],
      "",
      ["It's ", "not a gift card", "."],
      ["It's a ", "gesture she initiates", "—and he finishes."],
      ["It's ", "attention", " translated; it's ", "care", "."]
    ]
  },
  {
    title: "It's not a gift card.",
    content: [
      ["It's a ", "gesture she initiates", "—and he finishes."],
      ["It's ", "attention", " translated; it's ", "care", "."]
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
  const renderContentItem = (item: ContentItem, index: number): ReactNode => {
    // Case 1: String array with 4 elements - special case for "attention translated; it's care"
    if (Array.isArray(item) && typeof item[0] === 'string' && item.length === 4) {
      return (
        <p key={index} className="text-lg text-gray-700 leading-relaxed tracking-wide mb-8">
          {item[0]}
          <span className="font-bold">{item[1]}</span>
          {item[2]}
          <span className="font-bold">{item[3]}</span>
        </p>
      );
    }
    
    // Case 2: String array with 3 elements - standard format with one bold part
    if (Array.isArray(item) && typeof item[0] === 'string' && item.length === 3) {
      return (
        <p key={index} className="text-lg text-gray-700 leading-relaxed tracking-wide mb-8">
          {item[0]}
          <span className="font-bold">{item[1]}</span>
          {item[2]}
        </p>
      );
    }
    
    // Case 3: Object array for paired bold/normal text
    if (Array.isArray(item) && item.length > 0 && typeof item[0] === 'object' && 'text' in item[0]) {
      return (
        <div key={index} className="mb-4">
          <p className="text-lg font-bold text-gray-700 leading-relaxed tracking-wide mb-1">
            {item[0].text}
          </p>
          {item[1] && (
            <p className="text-lg text-gray-700 leading-relaxed tracking-wide mb-8">
              {item[1].text}
            </p>
          )}
        </div>
      );
    }
    
    // Case 4: Object with text property - for the items with isBold flag
    if (typeof item === 'object' && !Array.isArray(item) && 'text' in item) {
      return (
        <p key={index} className="text-lg text-gray-700 leading-relaxed tracking-wide mb-8">
          {item.isBold ? <span className="font-bold">{item.text}</span> : item.text}
          {item.suffix && item.suffix}
        </p>
      );
    }
    
    // Case 5: Simple string with checkmark
    if (typeof item === 'string' && item.startsWith('✔️')) {
      return (
        <p key={index} className="text-lg text-gray-700 leading-relaxed tracking-wide flex items-center gap-2 mb-8">
          <Check className="h-5 w-5 text-green-500" strokeWidth={3} />
          {item.replace('✔️', '')}
        </p>
      );
    }
    
    // Case 6: Simple string (catch-all for other string types)
    if (typeof item === 'string') {
      return <p key={index} className="text-lg text-gray-700 leading-relaxed tracking-wide mb-8">{item}</p>;
    }
    
    // Fallback
    return null;
  };

  return (
    <div className="py-3 relative max-w-3xl mx-auto">
      <Carousel
        opts={{
          align: "center",
          loop: true,
          slidesToScroll: 1,
          startIndex: 4, // Start at the "Ven Me Baby is not a brand" slide
        }}
        className="w-full relative"
      >
        <CarouselContent>
          {carouselItems.map((item, index) => (
            <CarouselItem key={index}>
              <div className="min-h-[500px] w-[90%] mx-auto p-6 rounded-2xl bg-gradient-to-br from-white via-white/95 to-pink-50/90 backdrop-blur-sm border border-pink-100 shadow-2xl hover:shadow-pink-100/20 transition-all flex flex-col justify-center">
                <h3 className="text-4xl mb-8 text-[#FF92A5] leading-tight text-center">{item.title}</h3>
                <div className="space-y-6 flex-grow">
                  {item.content.map((contentItem, i) => renderContentItem(contentItem, i))}
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