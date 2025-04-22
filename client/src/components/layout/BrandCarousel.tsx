import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Check } from "lucide-react";
import LogoText from '../shared/LogoText'; // Added import statement
import { ReactNode } from "react";

interface CardContentItem {
  text: string;
  isBold: boolean;
  suffix?: string;
  textComponent?: ReactNode;
}

type CardContent = 
  | CardContentItem[]
  | Array<CardContentItem[]>
  | Array<[string, string, string]>;

interface CarouselCard {
  title: string;
  titleComponent?: ReactNode;
  titleSuffix?: string;
  content: CardContent;
}

const carouselItems: CarouselCard[] = [
  {
    title: 'How ', 
    titleComponent: <LogoText size="inherit">Ven Me, Baby!</LogoText>, 
    titleSuffix: ' Works:',
    content: [
      { text: "He's been fishing for attention", isBold: true, suffix: " — you're inviting connection." },
      { text: "When he sees the message,", isBold: true, suffix: " he's thinking about you." },
      { text: "His thoughtful click says,", isBold: true, suffix: " \"I notice. I care. I SEE YOU.\"" },
      { text: "He steps up. You glow up.", isBold: true, suffix: " It's a twin win-win!!" },
      { text: "Words are free", isBold: true, suffix: " — attention is priceless!" }
    ]
  },
  {
    title: "Ven Me, Baby! Gifts Say He Values YOU!",
    titleComponent: null,
    titleSuffix: '',
    content: [
      { text: "He's not guessing", isBold: true, suffix: " — you've made it clear." },
      { text: "Your stylist has a spot today", isBold: true, suffix: " — and he's the one you thought of." },
      { text: "He gets the nudge", isBold: true, suffix: " — you? Top of mind... or no." },
      { text: "One click turns timing", isBold: true, suffix: " into thoughtfulness." },
      { text: "Bottom line: Your time and attention is valuable.", isBold: true },
      { text: "How valuable:", isBold: true, suffix: " You'll both find out." }
    ]
  },
  {
    title: "It Works Because it's—REAL!",
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
    title: "The Art of Gifting Refined!",
    content: [
      [
        { text: "Personal care gifting that works!", isBold: true },
        { text: "Timing matters; fit her schedule!", isBold: false }
      ],
      [
        { text: "Clients promo salon with their inner circle;", isBold: true },
        { text: "Ven Me, Baby! clients promote your offers!", isBold: false }
      ],
      [
        { text: "Ven Me Baby! Promos are pre-paid;", isBold: true },
        { text: "Reduce no-shows and cancellations", isBold: false }
      ]
    ]
  },
  {
    title: "Ven Me, Baby! Makes Gifting Make Sense",
    content: [
      ["The Art of Gifting Refined!", "", ""],
      ["It's the beautiful middle", "", " between asking and ignoring,"],
      ["", "between forgetting", " and showing up."],
      ["It's ", "not", " a gift card."],
      ["It's a gesture she initiates", "", "—and he finishes."],
      ["It's ", "attention", " translated into care."]
    ]
  },
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
                <h3 className="text-4xl mb-8 text-[#FF92A5] leading-tight text-center">
                  {item.title}
                  {item.titleComponent}
                  {item.titleSuffix}
                </h3>
                <div className="space-y-6 flex-grow">
                  {item.content.map((line, i) => {
                    // Handle string arrays with 3 elements (special format)
                    if (Array.isArray(line) && line.length === 3 && typeof line[0] === 'string') {
                      return (
                        <p key={i} className="text-lg text-gray-700 leading-relaxed tracking-wide mb-8">
                          {line[0]}
                          <span className="font-bold">{line[1]}</span>
                          {line[2]}
                        </p>
                      );
                    }
                    
                    // Handle arrays of CardContentItem objects
                    if (Array.isArray(line) && line.length === 2 && 
                        typeof line[0] === 'object' && 'text' in line[0] && 
                        typeof line[1] === 'object' && 'text' in line[1]) {
                      return (
                        <div key={i} className="mb-4">
                          <p className="text-lg font-bold text-gray-700 leading-relaxed tracking-wide mb-1">
                            {line[0].text}
                          </p>
                          <p className="text-lg text-gray-700 leading-relaxed tracking-wide mb-8">
                            {line[1].text}
                          </p>
                        </div>
                      );
                    }
                    
                    // Handle CardContentItem objects
                    if (!Array.isArray(line) && typeof line === 'object' && 'text' in line) {
                      return (
                        <p key={i} className="text-lg text-gray-700 leading-relaxed tracking-wide mb-8">
                          {line.isBold ? (
                            <span className="font-bold">
                              {line.text}
                              {line.textComponent}
                            </span>
                          ) : line.text}
                          {line.suffix}
                        </p>
                      );
                    }
                    
                    // Handle string content (unlikely with our typed structure but kept for legacy)
                    if (typeof line === 'string') {
                      if (line.startsWith('✔️')) {
                        return (
                          <p key={i} className="text-lg text-gray-700 leading-relaxed tracking-wide flex items-center gap-2 mb-8">
                            <Check className="h-5 w-5 text-green-500" strokeWidth={3} />
                            {line.replace('✔️', '')}
                          </p>
                        );
                      }
                      return <p key={i} className="text-lg text-gray-700 leading-relaxed tracking-wide mb-8">{line}</p>;
                    }
                    
                    return null;
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