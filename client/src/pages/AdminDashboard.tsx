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
                      {clients?.filter(client => client.isCurrentClient).map((client) => (
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
                      {salons?.map((salon) => (
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