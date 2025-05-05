import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserIcon, UserPlusIcon, ClipboardListIcon, HeartIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function InvitationsPage() {
  return (
    <div className="space-y-4 w-full">
      {/* VMB Tagline Card */}
      <Card className="rounded-xl shadow-sm overflow-hidden">
        <div className="bg-pink-50 pt-5 pb-2.5 flex justify-center items-center">
          <div className="flex items-center gap-1.5 text-sm">
            <HeartIcon className="h-3.5 w-3.5 text-red-500" />
            <span>
              <span className="text-black font-semibold">Ven Me,</span>
              <span className="text-pink-600 italic font-semibold">Baby!</span>
              <span className="text-gray-600"> Make Connections Personal!</span>
            </span>
            <HeartIcon className="h-3.5 w-3.5 text-red-500" />
          </div>
        </div>
      </Card>
      
      {/* Two option cards */}
      <Card className="rounded-xl shadow-sm overflow-hidden">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Send Invitation Card */}
            <div className="border rounded-lg p-4 bg-gradient-to-r from-pink-50 to-pink-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[180px] transition-all hover:shadow-md cursor-pointer">
              <div className="p-3 bg-white rounded-full mb-3">
                <UserPlusIcon className="h-8 w-8 text-pink-500" />
              </div>
              <h3 className="text-lg font-medium text-pink-800">Share Ven Me, Baby!!</h3>
              <p className="text-sm text-pink-700 mt-1">Invite your friends to join VMB</p>
            </div>

            {/* Invite a Friend Card (moved from GiftsPage) */}
            <div className="border rounded-lg p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[180px] transition-all hover:shadow-md cursor-pointer">
              <div className="p-3 bg-white rounded-full mb-3">
                <UserPlusIcon className="h-8 w-8 text-indigo-500" />
              </div>
              <h3 className="text-lg font-medium text-indigo-800">Register New VMB Salons</h3>
              <p className="text-sm text-indigo-700 mt-1">Sign-up Your Favorite Salons</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Invite Form (Collapsible) */}
      <Card className="rounded-xl shadow-sm overflow-hidden mt-4">
        <CardHeader className="bg-pink-50 pb-2 pt-2">
          <CardTitle className="text-base flex items-center gap-2 text-pink-700">
            <UserPlusIcon className="h-4 w-4" />
            Share Ven Me, Baby!
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipientName">Recipient Name</Label>
                <Input id="recipientName" placeholder="Enter name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientPhone">Recipient Phone</Label>
                <Input id="recipientPhone" placeholder="Enter phone number" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="recipientEmail">Recipient Email (Optional)</Label>
              <Input id="recipientEmail" placeholder="Enter email address" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Personal Message</Label>
              <Textarea 
                id="message" 
                placeholder="Add a personal message to your invitation"
                className="min-h-[100px]"
              />
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                Share VMB
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Invitation Status Card */}
      <Card className="rounded-xl shadow-sm overflow-hidden mt-4">
        <CardHeader className="bg-pink-50 pb-2 pt-2">
          <CardTitle className="text-base flex items-center gap-2 text-pink-700">
            <ClipboardListIcon className="h-4 w-4" />
            Your Sent Invitations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-center p-6 border border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500">You have no active invitations at the moment</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}