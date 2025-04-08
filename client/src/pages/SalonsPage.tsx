import { useQuery } from "@tanstack/react-query";
import { type Salon } from "@shared/schema";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useState } from "react";

export default function SalonsPage() {
  const { data: salons, isLoading, error } = useQuery<Salon[]>({
    queryKey: ["/api/salons"],
  });
  
  // State to track which salon cards are expanded
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  
  // Toggle function for expanding/collapsing salon details
  const toggleCard = (salonId: number) => {
    setExpandedCards(prev => ({
      ...prev,
      [salonId]: !prev[salonId]
    }));
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-2 py-2">
          <h1 className="text-xl font-bold mb-1 text-center text-[#FF92A5]">Den Be Baby! Salons</h1>
          <Separator className="my-1" />
          
          {isLoading && (
            <div className="flex justify-center items-center h-16 text-sm">
              <p className="text-gray-500">Loading salons...</p>
            </div>
          )}
          
          {error && (
            <div className="flex justify-center items-center h-16 text-sm">
              <p className="text-red-500">Error loading salons. Please try again later.</p>
            </div>
          )}
          
          {salons && salons.length === 0 && (
            <div className="flex justify-center items-center h-16 text-sm">
              <p className="text-gray-500">No salons available at the moment. Check back soon!</p>
            </div>
          )}
          
          <div className="flex flex-col space-y-1 mt-2">
            {salons?.map((salon) => (
              <div 
                key={salon.id} 
                className="border-b border-gray-200 py-2 first:pt-0 last:border-b-0"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-grow cursor-pointer" onClick={() => toggleCard(salon.id)}>
                    <h3 className="font-bold text-base leading-tight text-[#FF92A5]">{salon.name}</h3>
                    <div className="flex items-center text-xs text-gray-600">
                      <span>{salon.ownerName}</span> 
                      <span className="mx-1">•</span>
                      <span>{salon.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className="bg-[#FF92A5] text-white border-[#FF92A5] text-xs px-2 py-0 h-5 cursor-pointer hover:bg-[#ff7a92]"
                      onClick={() => toggleCard(salon.id)}
                    >
                      VIEW
                    </Badge>
                    <button 
                      className="text-[10px] text-gray-400 hover:text-gray-600 w-8 text-center" 
                      onClick={() => toggleCard(salon.id)}
                    >
                      {expandedCards[salon.id] ? '▲ hide' : '▼ show'}
                    </button>
                  </div>
                </div>
                
                {/* Expandable section */}
                {expandedCards[salon.id] && (
                  <div className="mt-1 pl-2 border-l-2 border-pink-100 ml-1">
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      <p><span className="font-medium text-gray-600">Email:</span> {salon.email}</p>
                      <p><span className="font-medium text-gray-600">Type:</span> {salon.type}</p>
                      {salon.socialMedia && salon.socialMedia.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-600 mt-1 mb-0.5">Social Media:</p>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(salon.socialMedia) && salon.socialMedia.map((item: any, index: number) => (
                              <Badge key={index} variant="outline" className="text-[10px] py-0 px-1 bg-white border-pink-200 text-pink-700">
                                {item.platform}: {item.handle}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-3 mb-2 text-center">
            <p className="text-xs mb-2">Join our network of professional salons today!</p>
            <Link href="/">
              <a className="inline-block px-3 py-1 bg-[#FF92A5] text-white rounded hover:bg-[#ff7a92] transition-colors text-xs">
                Register Your Salon
              </a>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}