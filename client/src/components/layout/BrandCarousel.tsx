import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const BrandCarousel: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const slides = [
    {
      id: 1,
      title: "French Tips & Touch-Ups",
      image: "/assets/french-tips.png",
      description: "Classic French manicure perfection"
    },
    {
      id: 2, 
      title: "Gel Manicure Luxury",
      image: "/assets/gel-manicure.png",
      description: "Long-lasting gel nail treatments"
    },
    {
      id: 3,
      title: "Custom Glam Design",
      image: "/assets/glam-design.png", 
      description: "Personalized nail art creations"
    },
    {
      id: 4,
      title: "Sculpted Acrylics",
      image: "/assets/sculpted-acrylics.png",
      description: "Professional acrylic nail extensions"
    }
  ];

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    setTranslateX(-diff);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const diff = startX - currentX;
    setTranslateX(-diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    handleSwipeEnd();
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    handleSwipeEnd();
  };

  const handleSwipeEnd = () => {
    setIsDragging(false);
    const threshold = 50;

    if (translateX > threshold) {
      // Swipe right - previous slide
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    } else if (translateX < -threshold) {
      // Swipe left - next slide
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }

    setTranslateX(0);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl overflow-hidden shadow-lg">
      <div 
        ref={carouselRef}
        className="relative h-64 sm:h-80 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-transform duration-300 ease-out ${
              index === currentSlide ? 'translate-x-0' : 
              index < currentSlide ? '-translate-x-full' : 'translate-x-full'
            }`}
            style={{
              transform: isDragging && index === currentSlide 
                ? `translateX(${translateX}px)` 
                : undefined
            }}
          >
            <div className="flex items-center justify-between h-full p-8">
              <div className="flex-1 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  {slide.title}
                </h2>
                <p className="text-gray-600 text-lg">
                  {slide.description}
                </p>
              </div>
              <div className="flex-1 flex justify-center">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-32 h-32 sm:w-48 sm:h-48 object-cover rounded-lg shadow-md pointer-events-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute top-1/2 transform -translate-y-1/2 w-full flex justify-between items-center px-4">
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
        >
          <ChevronRight className="w-6 h-6 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default BrandCarousel;