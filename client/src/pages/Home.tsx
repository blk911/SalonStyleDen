import { useState } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/layout/Hero";
import Footer from "@/components/layout/Footer";
import SalonForm from "@/components/forms/SalonForm";
import ClientForm from "@/components/forms/ClientForm";

export default function Home() {
  const [activeForm, setActiveForm] = useState<"salon" | "client" | null>(null);
  const [, setLocation] = useLocation();

  const showSalonForm = () => {
    setActiveForm("salon");
    setTimeout(() => {
      document.getElementById("salon-form-container")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const showClientForm = () => {
    setActiveForm("client");
    setTimeout(() => {
      document.getElementById("client-form-container")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };
  
  const goToPublicPage = () => {
    // For now, navigate to the first salon (ID: 1)
    setLocation("/salon/1");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Hero 
          onSalonClick={showSalonForm} 
          onClientClick={showClientForm}
          onPublicPageClick={goToPublicPage}
        />
        <section className="py-4 lg:py-8">
          <div className="max-w-3xl mx-auto px-2 sm:px-4 lg:px-6">
            {activeForm === "salon" && (
              <div id="salon-form-container">
                <SalonForm />
              </div>
            )}
            
            {activeForm === "client" && (
              <div id="client-form-container">
                <ClientForm />
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
