import React, { useState, useEffect } from "react";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import placeholderImage from '@/assets/placeholder-1.svg';
import shoppingWomanImage from '@/assets/shopping-woman.jpg';

interface TeaserSlide {
  title: string;
  content: string;
  bgClass: string;
  imageUrl?: string;
  visualCue: string;
}

const campaignSlides: TeaserSlide[] = [
  {
    title: "He's fishing for attention...",
    content: "...You're inviting connection.",
    bgClass: "bg-gradient-to-br from-pink-50 to-rose-100",
    imageUrl: shoppingWomanImage,
    visualCue: "Woman smiling while texting, soft/flirty colors."
  },
  {
    title: "One click says it all:",
    content: "'I Notice. I Care. I See You.'",
    bgClass: "bg-gradient-to-br from-purple-50 to-indigo-100",
    visualCue: "Phone screen lighting up with a gift invite."
  },
  {
    title: "He steps up. You glow up.",
    content: "#TwinWin #VenMeBaby",
    bgClass: "bg-gradient-to-br from-blue-50 to-teal-100",
    visualCue: "Split screen: him sending → her showing off nails."
  },
  {
    title: "Gift cards: Cold. Untimely. Forgotten.",
    content: "Ven Me, Baby: Real. Timed. Personal.",
    bgClass: "bg-gradient-to-br from-amber-50 to-yellow-100",
    visualCue: "Sad dusty gift card vs. bright, colorful Ven Me Baby screen."
  },
  {
    title: "Ready?",
    content: "1. Pick your style 💅\n2. Send your invite 💌\n3. Glow up 💖\nVen Me, Baby!",
    bgClass: "bg-gradient-to-br from-pink-50 to-rose-200",
    visualCue: "Fun emoji steps with clean bold design."
  }
];

export default function TeaserCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [api, setApi] = useState<any>(null);
  const tagline = "a connection-driven personal gifting platform";
  
  // Auto-play functionality
  useEffect(() => {
    if (!api || !isAutoPlaying) return;
    
    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000); // Change slide every 5 seconds
    
    return () => clearInterval(interval);
  }, [api, isAutoPlaying]);
  
  // Calculate progress percentage
  const progressPercentage = ((currentSlide + 1) / campaignSlides.length) * 100;

  return (
    <div className="relative overflow-hidden rounded-xl border shadow-xl">
      {/* Tagline at the top */}
      <div className="bg-gradient-to-r from-pink-700 to-fuchsia-600 py-1.5 px-3 text-white text-center text-sm font-medium shadow-sm">
        {tagline}
      </div>
      
      <div className="absolute top-8 left-2 right-2 z-10">
        <Progress 
          value={progressPercentage} 
          className="h-1.5 bg-gray-200/50"
        />
      </div>
      
      <Carousel 
        className="w-full" 
        opts={{
          loop: true,
          align: "center",
        }}
        setApi={(carouselApi) => {
          setApi(carouselApi);
          carouselApi?.on("select", () => {
            setCurrentSlide(carouselApi.selectedScrollSnap());
          });
        }}
      >
        <CarouselContent>
          {campaignSlides.map((slide, index) => (
            <CarouselItem key={index}>
              <div 
                className={cn(
                  "relative flex w-full p-4 rounded-lg overflow-hidden h-[280px]", 
                  slide.bgClass
                )}
              >
                {/* Visual Indicator */}
                <div className="absolute top-2 right-2 text-xs rounded-full bg-white/80 px-2 py-1 text-pink-600">
                  {index + 1}/{campaignSlides.length}
                </div>
                
                <div className="flex w-full h-full">
                  {/* Text Content Side */}
                  <div className="w-1/2 flex flex-col justify-center pr-4 text-left">
                    <h2 className="text-2xl font-semibold font-serif text-pink-800 leading-tight mb-3">
                      {slide.title}
                    </h2>
                    <div className="text-lg font-medium text-pink-600 whitespace-pre-line">
                      {slide.content}
                    </div>
                  </div>
                  
                  {/* Visual Cue Side */}
                  <div className="w-1/2 flex items-center justify-center">
                    <div className="w-full h-[200px] rounded-lg bg-white/30 backdrop-blur-sm p-3 shadow-lg border border-white/30 flex flex-col items-center justify-center relative overflow-hidden">
                      {/* Image - use slide.imageUrl if available, otherwise placeholder */}
                      <img 
                        src={slide.imageUrl || placeholderImage} 
                        alt={`Teaser visual for ${slide.title}`}
                        className="absolute inset-0 w-full h-full object-cover z-0 opacity-70"
                      />
                      <div className="z-10 bg-white/60 px-3 py-2 rounded text-sm text-gray-700 text-center mt-auto mb-2 max-w-[90%]">
                        <span className="font-semibold text-pink-600 mr-1">🧠</span>
                        {slide.visualCue}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <div className="flex items-center justify-between absolute bottom-4 left-4 right-4 z-10">
          <CarouselPrevious className="relative border-0 bg-white/80 hover:bg-white text-pink-600" />
          
          <div className="flex items-center gap-2">
            {campaignSlides.map((_, index) => (
              <Button 
                key={index} 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-2 w-2 rounded-full p-0 bg-gray-300", 
                  currentSlide === index && "bg-pink-600"
                )}
                onClick={() => {
                  setCurrentSlide(index);
                  api?.scrollTo(index);
                }}
              />
            ))}
          </div>
          
          <CarouselNext className="relative border-0 bg-white/80 hover:bg-white text-pink-600" />
        </div>
      </Carousel>
      
      {/* Auto-play toggle */}
      <Button 
        size="sm" 
        variant="ghost" 
        className="absolute top-10 right-3 z-10 h-8 w-8 rounded-full p-0 bg-white/80 hover:bg-white text-pink-600"
        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
      >
        {isAutoPlaying ? '⏸️' : '▶️'}
      </Button>
    </div>
  );
}