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
  imagesComponent?: ReactNode;
}

const carouselItems: CarouselCard[] = [
  {
    title: 'Why ', 
    titleComponent: <div className="logo logo-md" style={{ fontSize: '36px', display: 'inline' }}><span className="ven-me">Ven Me, </span><span className="baby">Baby!</span></div>, 
    titleSuffix: '',
    content: [
      { text: "He's fishing for attention", isBold: true, suffix: " — you're inviting connection." },
      { text: "Seeing your message,", isBold: true, suffix: " you're top of mind." },
      { text: "His thoughtful click says,", isBold: true, suffix: " \"I notice. I care. I see you!\"" },
      { text: "He steps up. You glow up.", isBold: true, suffix: " It's a twin-win!!" },
      { text: "Words are free", isBold: true, suffix: " — attention is priceless!" }
    ]
  },
  {
    title: "",
    titleComponent: <div className="logo logo-md"><span className="ven-me">Ven Me, </span><span className="baby">Baby!</span> Says "I value you"</div>,
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
    title: "",
    titleComponent: <div className="font-serif"><span className="logo logo-md"><span className="ven-me">Ven Me, </span><span className="baby">Baby!</span></span> Gifting Redefined!</div>,
    content: [
      { text: "The gift card trap", isBold: true, suffix: " — impersonal, untimely, and UNUSED." },
      { text: "You choose. They respond.", isBold: true, suffix: " No guessing. No missed signals." },
      { text: "Personally curated care", isBold: true, suffix: " — when it fits your schedule." },
      { text: "He shows up. You feel seen.", isBold: true, suffix: " The perfect \"twin-win\"!" },
      { text: "Prepaid = revenue locked in.", isBold: true, suffix: " No no-shows. No ghosting." },
      { text: "Yes,", isBold: true, suffix: " clients love promoting you in their BFF circles." }
    ]
  },
  {
    title: "",
    titleComponent: <div className="font-serif">One, Two, Three! <span className="logo logo-md"><span className="ven-me">Ven Me, </span><span className="baby">Baby!</span></span></div>,
    content: [],
    imagesComponent: (
      <div className="flex justify-between items-start gap-8 mt-8">
        <div className="flex-1 flex flex-col items-center text-center">
          <div className="bg-white rounded-lg overflow-hidden shadow-md h-40 w-full mb-4 flex items-center justify-center">
            <img 
              src="/assets/french_tips.jpg" 
              alt="French Tips" 
              className="object-cover w-full h-full"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/150?text=French+Tips";
                e.currentTarget.onerror = null;
              }} 
            />
          </div>
          <span className="text-base font-semibold text-gray-700">1. Pick your style</span>
        </div>
        
        <div className="flex-1 flex flex-col items-center text-center">
          <div className="bg-white rounded-lg overflow-hidden shadow-md h-40 w-full mb-4 flex items-center justify-center">
            <img 
              src="/assets/gift-request.png" 
              alt="Gift Request" 
              className="object-cover w-full h-full"
              onError={(e) => {
                e.currentTarget.src = "/assets/glam-design.png";
                e.currentTarget.onerror = null;
              }} 
            />
          </div>
          <span className="text-base font-semibold text-gray-700">2. Create your gift request</span>
        </div>
        
        <div className="flex-1 flex flex-col items-center text-center">
          <div className="bg-white rounded-lg overflow-hidden shadow-md h-40 w-full mb-4 flex items-center justify-center">
            <img 
              src="/assets/sculpted-acrylics.png" 
              alt="New Set" 
              className="object-cover w-full h-full"
              onError={(e) => {
                e.currentTarget.src = "/assets/Sculpted_Acrylics.png";
                e.currentTarget.onerror = null;
              }} 
            />
          </div>
          <span className="text-base font-semibold text-gray-700">3. Enjoy your new set!</span>
        </div>
      </div>
    )
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
                <h3 className="mb-8 text-[#FF92A5] leading-tight text-center font-serif" style={{ fontSize: '36px' }}>
                  {item.title}
                  {item.titleComponent}
                  {item.titleSuffix}
                </h3>
                {item.imagesComponent}
                <div className="space-y-4 flex-grow text-center">
                  {item.content && item.content.map((line, i) => {
                    // Handle string arrays with 3 elements (special format)
                    if (Array.isArray(line) && line.length === 3 && typeof line[0] === 'string') {
                      return (
                        <p key={i} className="text-lg text-gray-700 leading-relaxed tracking-wide mb-4 text-center">
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
                        <div key={i} className="mb-4 text-center">
                          <p className="text-lg font-bold text-gray-700 leading-relaxed tracking-wide mb-1 text-center">
                            {line[0].text}
                          </p>
                          <p className="text-lg text-gray-700 leading-relaxed tracking-wide mb-2 text-center">
                            {line[1].text}
                          </p>
                        </div>
                      );
                    }
                    
                    // Handle CardContentItem objects
                    if (!Array.isArray(line) && typeof line === 'object' && 'text' in line) {
                      return (
                        <p key={i} className="text-lg text-gray-700 leading-relaxed tracking-wide mb-4 text-center">
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
                          <p key={i} className="text-lg text-gray-700 leading-relaxed tracking-wide flex items-center justify-center gap-2 mb-4 text-center">
                            <Check className="h-5 w-5 text-green-500" strokeWidth={3} />
                            {line.replace('✔️', '')}
                          </p>
                        );
                      }
                      return <p key={i} className="text-lg text-gray-700 leading-relaxed tracking-wide mb-4 text-center">{line}</p>;
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