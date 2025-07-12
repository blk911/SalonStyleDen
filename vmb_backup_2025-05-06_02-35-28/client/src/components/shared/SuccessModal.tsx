import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

type SuccessModalProps = {
  type: "salon" | "client";
  countdown: number;
  onRedirect: () => void;
};

export default function SuccessModal({ type, countdown, onRedirect }: SuccessModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 bg-[#A7F3D0] rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-700" />
        </div>
        <h3 className="font-playfair font-bold text-xl mb-2">Registration Successful!</h3>
        <p className="text-gray-600 mb-6">Your information has been submitted successfully.</p>
        <div className="text-sm text-gray-500 mb-6">
          Redirecting to your dashboard in <span>{countdown}</span> seconds...
        </div>
        <Button 
          onClick={onRedirect}
          className="px-6 py-2 bg-[#FF92A5] hover:bg-[#E57C8E]"
        >
          Go to Dashboard Now
        </Button>
      </div>
    </div>
  );
}
