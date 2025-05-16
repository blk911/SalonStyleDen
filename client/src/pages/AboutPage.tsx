import React from "react";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow p-4 md:p-8 bg-gradient-to-b from-pink-50 to-white">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold text-center mb-2">About <span className="text-[#FF92A5]">Ven Me, Baby!</span></h1>
          <p className="text-gray-500 text-center mb-12">Empowering. Personal. Connection.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
                <p className="text-gray-600 mb-4">
                  At Ven Me, Baby! our mission is to transform how salon professionals connect with their clients through 
                  a gift economy platform that builds stronger relationships and enhances client loyalty.
                </p>
                <p className="text-gray-600">
                  We believe in the power of personal connection and generosity to create thriving
                  salon businesses where both professionals and clients benefit from a more meaningful relationship.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-semibold mb-4">The Gift Economy</h2>
                <p className="text-gray-600 mb-4">
                  Our platform is built on the principles of a gift economy, where value flows through networks of relationships
                  rather than traditional transactions. This creates a virtuous cycle of giving and receiving.
                </p>
                <p className="text-gray-600">
                  When clients share their positive experiences by gifting services to friends, the entire community benefits
                  through stronger connections and expanded networks.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-md hover:shadow-lg transition-shadow mb-12">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mb-4">
                    <span className="text-[#FF92A5] text-2xl font-bold">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Salon Connection</h3>
                  <p className="text-gray-600 text-sm">
                    Salon professionals invite clients to join the platform, establishing a direct digital relationship.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mb-4">
                    <span className="text-[#FF92A5] text-2xl font-bold">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Gifting Services</h3>
                  <p className="text-gray-600 text-sm">
                    Clients can gift salon services to friends and family, spreading the word about their favorite professionals.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mb-4">
                    <span className="text-[#FF92A5] text-2xl font-bold">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Growing Community</h3>
                  <p className="text-gray-600 text-sm">
                    As gifts are redeemed, new relationships form, creating a naturally expanding network of connections.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">Our Team</h2>
              <p className="text-gray-600 mb-6 text-center">
                Our dedicated team combines expertise in salon industry knowledge with technological innovation
                to create a platform that truly understands the needs of beauty professionals and their clients.
              </p>
              
              <div className="flex justify-center mb-6">
                <div className="w-24 h-1 bg-[#FF92A5] rounded-full"></div>
              </div>

              <div className="text-center">
                <p className="text-gray-600 italic">
                  "We believe that genuine human connection is the foundation of any successful salon business.
                  Our platform simply facilitates what great stylists already do naturally - create meaningful relationships
                  that extend beyond the salon chair."
                </p>
                <p className="text-[#FF92A5] mt-4 font-semibold">— The VMB Team</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}