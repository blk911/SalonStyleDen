import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeartIcon, PlusCircleIcon, UserPlusIcon } from "lucide-react";

export default function GiftsPage() {
  return (
    <div className="space-y-4 w-full">
      {/* SHARE VMB Card - Always shown whether client has a salon or not */}
      <Card className="rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="bg-pink-50 pb-2 pt-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base flex items-center gap-2">
              <HeartIcon className="h-4 w-4 text-red-500" />
              <span>
                <span className="text-black font-semibold">Ven Me,</span>
                <span className="text-pink-600 italic font-semibold">Baby!</span>
                <span className="text-red-500"> Make Connections Personal!</span>
              </span>
              <HeartIcon className="h-4 w-4 text-red-500" />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 bg-gradient-to-r from-pink-50 to-pink-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[180px] transition-all hover:shadow-md cursor-pointer">
              <div className="p-3 bg-white rounded-full mb-3">
                <PlusCircleIcon className="h-8 w-8 text-pink-500" />
              </div>
              <h3 className="text-lg font-medium text-pink-800">Create New Gift</h3>
              <p className="text-sm text-pink-700 mt-1">Send someone special a salon treatment</p>
            </div>

            <div className="border rounded-lg p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[180px] transition-all hover:shadow-md cursor-pointer">
              <div className="p-3 bg-white rounded-full mb-3">
                <UserPlusIcon className="h-8 w-8 text-indigo-500" />
              </div>
              <h3 className="text-lg font-medium text-indigo-800">Invite a Friend</h3>
              <p className="text-sm text-indigo-700 mt-1">Share your favorite salon with friends</p>
            </div>
          </div>
        </CardContent>
      </Card>
  
      {/* Gift Status Card */}
      <Card className="rounded-xl shadow-sm overflow-hidden mt-4">
        <CardHeader className="bg-pink-50 pb-2 pt-2">
          <CardTitle className="text-base text-pink-700">Your Gift Status</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-center p-6 border border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500">You have no active gifts at the moment</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}