import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/layout/Hero";
import Footer from "@/components/layout/Footer";
import BrandCarousel from "@/components/layout/BrandCarousel";
import { InstructionPopup } from "@/components/ui/InstructionPopup";
import { Heart, Sparkles } from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();
  const [isWelcomePopupOpen, setIsWelcomePopupOpen] = useState(true);

  // Check if user has seen the welcome popup before
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("vmb-has-seen-welcome");
    if (hasSeenWelcome) {
      setIsWelcomePopupOpen(false);
    }
  }, []);

  // Mark that user has seen the welcome popup
  const handleCloseWelcomePopup = () => {
    setIsWelcomePopupOpen(false);
    localStorage.setItem("vmb-has-seen-welcome", "true");
  };

  const handleSalonClick = () => {
    navigate("/salon-registration");
  };

  const handleClientClick = () => {
    navigate("/client-registration");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Hero 
          onSalonClick={handleSalonClick} 
          onClientClick={handleClientClick}
          salonName="Ven Me, Baby!"
          salonOwnerName="Tiffany"
          ownerPhotoUrl="" // Empty string to ensure VMB logo is used
        />
        <BrandCarousel />
      </main>
      <Footer />

      {/* Welcome Instruction Popup */}
      <InstructionPopup
        title="Welcome to Ven Me, Baby!"
        description="See how Ven Me Baby makes gifting personal work... for real!"
        isOpen={isWelcomePopupOpen}
        onClose={handleCloseWelcomePopup}
        steps={[
          "For salons: Easily manage clients and promote your services.",
          "For clients: Create personalized gift invitations for your favorite services.",
          "Connect with friends and family through meaningful gifting experiences.",
          "Experience the future of personal care gifting!"
        ]}
        icon={<Heart className="h-5 w-5 text-pink-500" />}
        actionText="Get Started"
        className="border-t-4 border-pink-400"
      />
    </div>
  );
}
