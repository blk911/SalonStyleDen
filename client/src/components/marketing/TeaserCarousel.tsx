import React, { useState, useEffect, useRef } from "react";
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
import himReceivingVideo from '@/assets/him_rcv_vmb.mp4';
import boomVideo from '@/assets/BOOM.mp4';
import endVideo from '@/assets/end3.mp4';
import finalVideo from '@/assets/end.mp4';

interface TeaserSlide {
  title: string;
  content: string;
  bgClass: string;
  imageUrl?: string;
  videoUrl?: string;
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
    videoUrl: himReceivingVideo,
    visualCue: "Phone screen lighting up with a gift invite."
  },
  {
    title: "He steps up. You glow up.",
    content: "#TwinWin #VenMeBaby",
    bgClass: "bg-gradient-to-br from-blue-50 to-teal-100",
    videoUrl: boomVideo,
    visualCue: "Split screen: him sending → her showing off nails."
  },
  {
    title: "Gift cards: Cold. Untimely. Forgotten.",
    content: "Ven Me, Baby: Real. Timed. Personal.",
    bgClass: "bg-gradient-to-br from-amber-50 to-yellow-100",
    videoUrl: endVideo,
    visualCue: "Sad dusty gift card vs. bright, colorful Ven Me Baby screen."
  },
  {
    title: "Ready?",
    content: "1. Pick your style 💅\n2. Send your invite 💌\n3. Glow up 💖\nVen Me, Baby!",
    bgClass: "bg-gradient-to-br from-pink-50 to-rose-200",
    videoUrl: finalVideo,
    visualCue: "Fun emoji steps with clean bold design."
  }
];

// Individual slide component to handle video refs properly
const CarouselSlide = ({ 
  slide, 
  index, 
  totalSlides,
  isActive
}: { 
  slide: TeaserSlide; 
  index: number;
  totalSlides: number;
  isActive: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isLastSlide = index === totalSlides - 1;

  // Special handling for videos
  useEffect(() => {
    if (!isActive || !videoRef.current || !slide.videoUrl) return;

    // For all slides, reset to beginning when they appear
    videoRef.current.currentTime = 0;
    videoRef.current.play();

    // Special handling for the last slide (freeze frame after 2.25 seconds)
    if (isLastSlide) {
      const timer = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.pause();
        }
      }, 2250); // 2.25 seconds

      return () => clearTimeout(timer);
    }
  }, [isActive, slide.videoUrl, isLastSlide]);

  return (
    <CarouselItem key={index}>
      <div 
        className={cn(
          "relative flex w-full p-4 rounded-lg overflow-hidden h-[280px]", 
          slide.bgClass
        )}
      >
        {/* Visual Indicator (hidden) */}
        <div className="hidden">
          {index + 1}/{totalSlides}
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
            <div className="w-full h-[200px] rounded-lg overflow-hidden">
              {/* Video or Image */}
              {slide.videoUrl ? (
                <div className="w-full h-full flex items-center justify-center bg-black/5 overflow-hidden">
                  <video 
                    ref={videoRef}
                    src={slide.videoUrl} 
                    autoPlay 
                    loop={!isLastSlide} 
                    muted 
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <img 
                  src={slide.imageUrl || placeholderImage} 
                  alt={`Teaser visual for ${slide.title}`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </CarouselItem>
  );
};

export default function TeaserCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [api, setApi] = useState<any>(null);
  const tagline = "a connection-driven personal gifting platform";
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Touch/swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.touches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      api?.scrollNext();
    } else if (isRightSwipe) {
      api?.scrollPrev();
    }
  };

  // Calculate progress percentage
  const progressPercentage = ((currentSlide + 1) / campaignSlides.length) * 100;

  return (
    <div className="w-full">
      {/* Carousel Section */}
      <div 
        className="relative overflow-hidden rounded-xl border shadow-xl"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Small tagline indicator (hidden) */}
        <div className="hidden">
          {tagline}
        </div>

        <div className="absolute top-2 left-2 right-2 z-10">
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
          dragFree: true,
          containScroll: "trimSnaps"
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
            <CarouselSlide 
              key={index}
              slide={slide} 
              index={index}
              totalSlides={campaignSlides.length}
              isActive={currentSlide === index}
            />
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
      </div>

      {/* Testimonial Cards - positioned after carousel */}
      <div className="testimonial-section mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Salon Owner Benefits Card */}
        <div className="vmb-testimonial-card vmb-salon-card bg-white rounded-lg shadow-md border transition-all duration-300 cursor-pointer hover:shadow-lg overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">👩‍💼</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-blue-800 leading-tight">Salon Owner Benefits</h3>
                <p className="text-xs text-gray-600 truncate">Michelle S., VMB Certified Stylist</p>
              </div>
            </div>
            <button 
              onClick={() => setExpandedCard(expandedCard === 'salon' ? null : 'salon')}
              className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-110"
            >
              <span className="text-white text-[10px] font-bold leading-none">
                {expandedCard === 'salon' ? '−' : '+'}
              </span>
            </button>
          </div>

          {expandedCard === 'salon' && (
            <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
              <p className="text-sm text-gray-700 italic mb-3">
                "VMB has transformed how I connect with clients. The personalized invitation feature makes client acquisition effortless, and I've seen a 40% increase in client retention! The system's intuitive design has streamlined my scheduling process so I can focus on what matters - delivering exceptional service."
              </p>
              <div className="flex items-center gap-1 text-yellow-500 text-sm">
                <span>⭐⭐⭐⭐⭐</span>
                <span className="text-gray-600 ml-2">Verified VMB Partner</span>
              </div>
            </div>
          )}
        </div>

        {/* Client Success Stories Card */}
        <div className="vmb-testimonial-card vmb-client-card bg-white rounded-lg shadow-md border transition-all duration-300 cursor-pointer hover:shadow-lg overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">💅</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-green-800 leading-tight">Client Success Stories</h3>
                <p className="text-xs text-gray-600 truncate">Kendra T., Premium Client</p>
              </div>
            </div>
            <button 
              onClick={() => setExpandedCard(expandedCard === 'client' ? null : 'client')}
              className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-110"
            >
              <span className="text-white text-[10px] font-bold leading-none">
                {expandedCard === 'client' ? '−' : '+'}
              </span>
            </button>
          </div>

          {expandedCard === 'client' && (
            <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
              <p className="text-sm text-gray-700 italic mb-3">
                "I adore the personalized VMB experience! Receiving an invitation makes me feel valued and special. The style selection is intuitive and helps me explore new options. Since discovering VMB, I've scheduled all my appointments through the platform - it's become essential to my self-care routine and I recommend it to everyone!"
              </p>
              <div className="flex items-center gap-1 text-yellow-500 text-sm">
                <span>⭐⭐⭐⭐⭐</span>
                <span className="text-gray-600 ml-2">VMB Member since 2024</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}