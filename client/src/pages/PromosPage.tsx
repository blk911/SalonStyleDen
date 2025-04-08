import { useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

// Sample promotion data
const promos = [
  {
    id: 1,
    title: "Spring Beauty Special",
    description: "20% off all manicure services. Perfect time to refresh your look!",
    category: "seasonal",
    validUntil: "May 31, 2025",
    discount: "20%",
    serviceType: "Manicure",
    isVip: false
  },
  {
    id: 2,
    title: "VIP Member Exclusive",
    description: "Complimentary nail art with any gel manicure for VMB members only.",
    category: "vip",
    validUntil: "December 31, 2025",
    discount: "Free nail art",
    serviceType: "Gel Manicure",
    isVip: true
  },
  {
    id: 3,
    title: "Refer a Friend",
    description: "Refer a friend and both get 15% off your next visit.",
    category: "referral",
    validUntil: "Ongoing",
    discount: "15%",
    serviceType: "Any service",
    isVip: false
  },
  {
    id: 4,
    title: "VMB Birthday Special",
    description: "Free deluxe spa pedicure on your birthday month.",
    category: "vip",
    validUntil: "Ongoing",
    discount: "Free service",
    serviceType: "Deluxe Spa Pedicure",
    isVip: true
  },
  {
    id: 5,
    title: "First-time Client Offer",
    description: "10% off your first service with us. Welcome to our nail family!",
    category: "new",
    validUntil: "Ongoing",
    discount: "10%",
    serviceType: "Any service",
    isVip: false
  },
  {
    id: 6,
    title: "VMB Loyalty Reward",
    description: "After 5 services, get your 6th at 50% off. Exclusive for VMB members.",
    category: "vip",
    validUntil: "Ongoing",
    discount: "50%",
    serviceType: "Any service",
    isVip: true
  }
];

export default function PromosPage() {
  const [activeTab, setActiveTab] = useState("all");
  
  const filteredPromos = activeTab === "all" 
    ? promos 
    : activeTab === "vip" 
      ? promos.filter(promo => promo.isVip)
      : promos.filter(promo => !promo.isVip);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4 text-center text-[#FF92A5]">VMB Promotions</h1>
          <p className="text-center mb-6 max-w-2xl mx-auto">
            Exclusive offers for our valued clients. Join our VMB (Very Manicured Baby) program to unlock special VIP promotions!
          </p>
          <Separator className="my-4" />
          
          <Tabs defaultValue="all" className="w-full max-w-3xl mx-auto mt-8" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Promotions</TabsTrigger>
              <TabsTrigger value="vip">VMB Exclusives</TabsTrigger>
              <TabsTrigger value="standard">Standard Offers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPromos.map(promo => (
                  <PromoCard key={promo.id} promo={promo} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="vip" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPromos.map(promo => (
                  <PromoCard key={promo.id} promo={promo} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="standard" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPromos.map(promo => (
                  <PromoCard key={promo.id} promo={promo} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-16 bg-pink-50 rounded-lg p-8 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-3">Join Our VMB Program</h2>
            <p className="mb-6">
              Become a Very Manicured Baby member and enjoy exclusive discounts, 
              promotions, and special treatment at all our partner salons.
            </p>
            <Button className="bg-[#FF92A5] hover:bg-[#ff7a92]">
              Sign Up Now
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function PromoCard({ promo }: { promo: any }) {
  return (
    <Card className={`overflow-hidden ${promo.isVip ? 'border-pink-300 bg-pink-50/30' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{promo.title}</CardTitle>
          {promo.isVip && (
            <Badge className="bg-[#FF92A5] text-white">
              VMB Exclusive
            </Badge>
          )}
        </div>
        <CardDescription>Valid until: {promo.validUntil}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-3">{promo.description}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            {promo.discount} off
          </Badge>
          <Badge variant="outline" className="text-xs">
            {promo.serviceType}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="outline" size="sm" className="w-full border-[#FF92A5] text-[#FF92A5] hover:bg-[#FF92A5] hover:text-white">
          Claim Offer
        </Button>
      </CardFooter>
    </Card>
  );
}