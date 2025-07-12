import { useLocation } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/layout/Hero";
import Footer from "@/components/layout/Footer";
import BrandCarousel from "@/components/layout/BrandCarousel";

export default function Home() {
  const [, navigate] = useLocation();

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
    </div>
  );
}
