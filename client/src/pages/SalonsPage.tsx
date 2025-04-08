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
        <div className="container mx-auto px-2 py-4">
          <h1 className="text-2xl font-bold mb-2 text-center text-[#FF92A5]">Den Be Baby! Salons</h1>
          <Separator className="my-2" />
          
          {isLoading && (
            <div className="flex justify-center items-center h-32">
              <p className="text-gray-500">Loading salons...</p>
            </div>
          )}
          
          {error && (
            <div className="flex justify-center items-center h-32">
              <p className="text-red-500">Error loading salons. Please try again later.</p>
            </div>
          )}
          
          {salons && salons.length === 0 && (
            <div className="flex justify-center items-center h-32">
              <p className="text-gray-500">No salons available at the moment. Check back soon!</p>
            </div>
          )}
          
          <div className="flex flex-col space-y-2 mt-2">
            {salons?.map((salon) => (
              <Card key={salon.id} className="overflow-hidden hover:shadow-sm transition-shadow border border-gray-200">
                <CardContent className="p-3">
                  <div 
                    className="flex justify-between items-center cursor-pointer" 
                    onClick={() => toggleCard(salon.id)}
                  >
                    <div>
                      <h3 className="font-bold text-lg">{salon.name}</h3>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-1">{salon.ownerName}</span> • 
                        <span className="ml-1">{salon.phone}</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200 mr-2">
                        Salon
                      </Badge>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className={`transition-transform ${expandedCards[salon.id] ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Expandable section */}
                  {expandedCards[salon.id] && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-sm mb-1"><span className="font-medium">Email:</span> {salon.email}</p>
                      
                      {salon.socialMedia && salon.socialMedia.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-xs font-semibold mb-1">Social Media</h4>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(salon.socialMedia) && salon.socialMedia.map((item: any, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs py-0 px-1">
                                {item.platform}: {item.handle}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Are you a salon owner?</h2>
            <p className="mb-3 text-sm">Join our network of professional salons and reach more clients.</p>
            <Link href="/">
              <a className="inline-block px-4 py-2 bg-[#FF92A5] text-white rounded-md hover:bg-[#ff7a92] transition-colors text-sm">
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