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
            <div className="flex justify-center gap-4 flex-wrap">
              <Link href="/salon-registration">
                <Button 
                  variant="default"
                  size="lg"
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                >
                  I'm a Salon Owner
                </Button>
              </Link>
              <Link href="/register">
                <Button 
                  variant="outline"
                  size="lg"
                  className="border-pink-300 text-pink-700 hover:bg-pink-50"
                >
                  I'm a Client
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}