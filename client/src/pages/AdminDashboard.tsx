import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Link } from 'wouter';


interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  salonName?: string;
  isCurrentClient: boolean;
  salonId?: number; // Added salonId to Client interface
}

interface Salon {
  id: number;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();

  const { data: clients, error: clientError, isLoading: clientIsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/clients');
        if (!response.ok) {
          throw new Error('Failed to fetch clients');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }
    },
  });

  const { data: salons, error: salonError, isLoading: salonIsLoading } = useQuery({
    queryKey: ['salons'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/salons');
        if (!response.ok) {
          throw new Error('Failed to fetch salons');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching salons:', error);
        throw error;
      }
    },
  });

  if (clientIsLoading || salonIsLoading) return <div>Loading...</div>;
  if (clientError) return <div>Error loading clients: {clientError.message}</div>;
  if (salonError) return <div>Error loading salons: {salonError.message}</div>;


  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

          {/* Ven Me Baby Style Options */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-4">Ven Me, Baby! Style Options</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border border-pink-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-2">
                    <div className="flex">
                      {/* Left Side - Text */}
                      <div className="w-2/3 text-left pr-2">
                        <h3 className="font-medium">French Tips / Touch-Up</h3>
                        <p className="text-xs text-gray-600 mb-2">Classic white tips or quick polish refresh.</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold">$40</span>
                          <span className="text-xs">30 min</span>
                        </div>
                      </div>
                      {/* Right Side - Image */}
                      <div className="w-1/3 flex items-center justify-end pl-2">
                        <img 
                          src="/assets/french_tips.jpg" 
                          alt="French Tips" 
                          className="rounded h-20 w-20 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/assets/VMB LOGO sized1.png';
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-pink-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-2">
                    <div className="flex">
                      {/* Left Side - Text */}
                      <div className="w-2/3 text-left pr-2">
                        <h3 className="font-medium">Luxe Gel Manicure</h3>
                        <p className="text-xs text-gray-600 mb-2">Glossy, chip-free color with lasting shine.</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold">$55</span>
                          <span className="text-xs">45 min</span>
                        </div>
                      </div>
                      {/* Right Side - Image */}
                      <div className="w-1/3 flex items-center justify-end pl-2">
                        <img 
                          src="/assets/Luxe_Gel_Manicure_1744299210155.png" 
                          alt="Luxe Gel Manicure" 
                          className="rounded h-20 w-20 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/assets/VMB LOGO sized1.png';
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-pink-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-2">
                    <div className="flex">
                      {/* Left Side - Text */}
                      <div className="w-2/3 text-left pr-2">
                        <h3 className="font-medium">Sculpted Acrylics</h3>
                        <p className="text-xs text-gray-600 mb-2">Custom-shaped acrylics for bold length.</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold">$70</span>
                          <span className="text-xs">60 min</span>
                        </div>
                      </div>
                      {/* Right Side - Image */}
                      <div className="w-1/3 flex items-center justify-end pl-2">
                        <img 
                          src="/assets/Sculpted_Acrylics_1744299183531.png" 
                          alt="Sculpted Acrylics" 
                          className="rounded h-20 w-20 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/assets/VMB LOGO sized1.png';
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-pink-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-2">
                    <div className="flex">
                      {/* Left Side - Text */}
                      <div className="w-2/3 text-left pr-2">
                        <h3 className="font-medium">Glam Me! Custom Design</h3>
                        <p className="text-xs text-gray-600 mb-2">Fully custom art, gems, 3D extras.</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold">$125+</span>
                          <span className="text-xs">90 min</span>
                        </div>
                      </div>
                      {/* Right Side - Image */}
                      <div className="w-1/3 flex items-center justify-end pl-2">
                        <img 
                          src="/assets/Glam_Me!_Custom_Design_1744299155324.png" 
                          alt="Glam Me! Custom Design" 
                          className="rounded h-20 w-20 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/assets/VMB LOGO sized1.png';
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {/* Clients Table */}
            <Card>
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-4">Current Clients</h2>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="max-h-[30px]">
                        <TableHead className="max-h-[30px] py-1">Name</TableHead>
                        <TableHead className="max-h-[30px] py-1">Email</TableHead>
                        <TableHead className="max-h-[30px] py-1">Phone</TableHead>
                        <TableHead className="max-h-[30px] py-1">Salon</TableHead>
                        <TableHead className="max-h-[30px] py-1 text-right">Actions</TableHead> {/* Changed header text */}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients?.filter((client: Client) => client.isCurrentClient).map((client: Client) => (
                        <TableRow
                          key={client.id}
                          className="hover:bg-gray-50 h-[30px]"
                        >
                          <TableCell className="py-0">{client.name}</TableCell>
                          <TableCell className="py-0">{client.email}</TableCell>
                          <TableCell className="py-0">{client.phone}</TableCell>
                          <TableCell className="py-0">{client.salonName || 'N/A'}</TableCell>
                          <TableCell className="py-0 text-right">
                            <div className="flex justify-end gap-1">
                              <Link href={`/client/${client.id}`}>
                                <button className="px-2 py-1 text-[10px] bg-[#FF92A5] text-white rounded hover:bg-[#ff7a92]">
                                  Client Page
                                </button>
                              </Link>
                              {client.salonId && (
                                <Link href={`/salon/${client.salonId}`}>
                                  <button className="px-2 py-1 text-[10px] bg-pink-100 text-pink-700 rounded hover:bg-pink-200">
                                    Salon Page
                                  </button>
                                </Link>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Salons Table */}
            <Card>
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-4">Salons</h2>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salons?.map((salon: Salon) => (
                        <TableRow
                          key={salon.id}
                          className="cursor-pointer hover:bg-gray-50"
                          //onClick={() => setLocation(`/salon/${salon.id}`)}
                        >
                          <TableCell>{salon.id}</TableCell>
                          <TableCell>{salon.name}</TableCell>
                          <TableCell>{salon.ownerName}</TableCell>
                          <TableCell>{salon.email}</TableCell>
                          <TableCell>{salon.phone}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Link href={`/salon/${salon.id}`}>
                                <button className="px-2 py-1 text-[10px] bg-pink-100 text-pink-700 rounded hover:bg-pink-200">
                                  Salon Page
                                </button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}