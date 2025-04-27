import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Hero() {
  return (
    <div className="bg-white">
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-4xl py-8 sm:py-12">
          <div className="text-center">
            <p className="text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              <i>The perfect gift is perfectly timed!</i>
            </p>
            <div className="flex justify-center gap-4 mb-16">
              <Link href="/salon-registration">
                <Button 
                  className="bg-pink-400 hover:bg-pink-500 text-white px-8 py-2 rounded-full text-lg font-medium"
                >
                  I'm a Salon Owner
                </Button>
              </Link>
              <Link href="/register">
                <Button 
                  variant="outline"
                  className="border-2 border-pink-400 text-pink-400 hover:bg-pink-50 px-8 py-2 rounded-full text-lg font-medium"
                >
                  I'm a Client
                </Button>
              </Link>
            </div>
            <h2 className="text-5xl text-pink-400 font-light mb-12">One, Two, Three! Ven Me, Baby!</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <img src="/assets/french-tips.jpg" alt="Nail style" className="w-full rounded-lg mb-4" />
                <h3 className="text-xl text-gray-700">1. Pick your style</h3>
              </div>
              <div className="text-center">
                <img src="/assets/logos/vmb-logo.png" alt="Gift request" className="w-full rounded-lg mb-4" />
                <h3 className="text-xl text-gray-700">2. Create your gift request</h3>
              </div>
              <div className="text-center">
                <img src="/assets/glam-design.png" alt="New set" className="w-full rounded-lg mb-4" />
                <h3 className="text-xl text-gray-700">3. Enjoy your new set!</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}