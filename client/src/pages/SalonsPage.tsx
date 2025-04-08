import { useQuery } from "@tanstack/react-query";
import { type Salon } from "@shared/schema";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function SalonsPage() {
  const { data: salons, isLoading, error } = useQuery<Salon[]>({
    queryKey: ["/api/salons"],
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4 text-center text-[#FF92A5]">Our Partner Salons</h1>
          <Separator className="my-4" />
          
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">Loading salons...</p>
            </div>
          )}
          
          {error && (
            <div className="flex justify-center items-center h-64">
              <p className="text-red-500">Error loading salons. Please try again later.</p>
            </div>
          )}
          
          {salons && salons.length === 0 && (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">No salons available at the moment. Check back soon!</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {salons?.map((salon) => (
              <Card key={salon.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold">{salon.name}</CardTitle>
                    <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                      Salon
                    </Badge>
                  </div>
                  <CardDescription>Owner: {salon.ownerName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Email:</span> {salon.email}</p>
                    <p className="text-sm"><span className="font-medium">Phone:</span> {salon.phone}</p>
                    
                    {salon.socialMedia && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold mb-2">Social Media</h4>
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(salon.socialMedia) && salon.socialMedia.map((item: any, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {item.platform}: {item.handle}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-semibold mb-4">Are you a salon owner?</h2>
            <p className="mb-6">Join our network of professional salons and reach more clients.</p>
            <Link href="/">
              <a className="inline-block px-6 py-3 bg-[#FF92A5] text-white rounded-md hover:bg-[#ff7a92] transition-colors">
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