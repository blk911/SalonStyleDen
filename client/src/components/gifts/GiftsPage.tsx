import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GiftsPage() {
  return (
    <div className="space-y-4 w-full">
      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>
        
        <TabsContent value="new" className="mt-4">
          {/* New gifts content will go here */}
          <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm text-center">
              New gifts content will be added here
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="status" className="mt-4">
          {/* Gift status content will go here */}
          <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm text-center">
              Gift status tracking will be added here
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}