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
  const [salonCardExpanded, setSalonCardExpanded] = useState(false);
  const [clientCardExpanded, setClientCardExpanded] = useState(false);

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

      {/* Collapsible testimonial cards */}
      <div className="mt-6 space-y-4">
        {/* Collapsible Salon Owner Benefits Card */}
      <div 
        className="bg-white rounded-lg shadow-md border border-gray-200 mb-4 transition-all duration-300 ease-in-out overflow-hidden"
        onMouseEnter={() => setSalonCardExpanded(true)}
        onMouseLeave={() => setSalonCardExpanded(false)}
      >
        <div className="p-4 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/assets/MS-VMBLTD.jpg" 
                alt="Michelle S." 
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
              />
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-1">Salon Owner Benefits</h3>
                <p className="text-sm text-gray-600">Michelle S., VMB Certified Stylist</p>
              </div>
            </div>
            <div className="text-blue-500">
              {salonCardExpanded ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
            </div>
          </div>

          {salonCardExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center mb-3">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">Verified VMB Partner</span>
              </div>
              <blockquote className="text-gray-700 text-sm leading-relaxed mb-4">
                "VMB has transformed how I connect with clients. The personalized invitation feature makes client 
                acquisition effortless, and I've seen a 40% increase in client retention! The system's intuitive design 
                has streamlined my scheduling process so I can focus on what matters - delivering exceptional service."
              </blockquote>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2">
                <span>See How Easy! ✨</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Client Success Stories Card */}
      <div 
        className="bg-white rounded-lg shadow-md border border-gray-200 transition-all duration-300 ease-in-out overflow-hidden"
        onMouseEnter={() => setClientCardExpanded(true)}
        onMouseLeave={() => setClientCardExpanded(false)}
      >
        <div className="p-4 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/assets/kendra.png" 
                alt="Kendra T." 
                className="w-12 h-12 rounded-full object-cover border-2 border-green-200"
              />
              <div>
                <h3 className="text-lg font-semibold text-green-600 mb-1">Client Success Stories</h3>
                <p className="text-sm text-gray-600">Kendra T., Premium Client</p>
              </div>
            </div>
            <div className="text-green-500">
              {clientCardExpanded ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
            </div>
          </div>

          {clientCardExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center mb-3">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">Verified Premium Client</span>
              </div>
              <blockquote className="text-gray-700 text-sm leading-relaxed mb-4">
                "I adore the personalized VMB experience! Receiving an invitation makes me feel valued and special. 
                The seamless booking process and the thoughtful touches my stylist adds make every appointment feel 
                like a luxury experience. It's completely transformed how I view salon visits!"
              </blockquote>
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2">
                <span>Create Your Gift! 🎁</span>
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}