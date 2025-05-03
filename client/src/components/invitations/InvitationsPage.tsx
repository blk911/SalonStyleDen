import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InvitationsPage() {
  return (
    <div className="space-y-4 w-full">
      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send">Send</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>
        
        <TabsContent value="send" className="mt-4">
          {/* Send invitations content will go here */}
        </TabsContent>
        
        <TabsContent value="status" className="mt-4">
          {/* Invitation status content will go here */}
        </TabsContent>
      </Tabs>
    </div>
  );
}