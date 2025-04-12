
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  salonName?: string;
  isCurrentClient: boolean;
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

  const { data: clients } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients');
      return response.json();
    },
  });

  const { data: salons } = useQuery<Salon[]>({
    queryKey: ['/api/salons'],
    queryFn: async () => {
      const response = await fetch('/api/salons');
      return response.json();
    },
  });

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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients?.filter(client => client.isCurrentClient).map((client) => (
                        <TableRow 
                          key={client.id}
                          className="cursor-pointer hover:bg-gray-50 max-h-[30px]"
                          onClick={() => setLocation(`/client/${client.id}`)}
                        >
                          <TableCell className="max-h-[30px] py-1">{client.name}</TableCell>
                          <TableCell className="max-h-[30px] py-1">{client.email}</TableCell>
                          <TableCell className="max-h-[30px] py-1">{client.phone}</TableCell>
                          <TableCell className="max-h-[30px] py-1">{client.salonName || 'N/A'}</TableCell>
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salons?.map((salon) => (
                        <TableRow 
                          key={salon.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => setLocation(`/salon/${salon.id}`)}
                        >
                          <TableCell>{salon.id}</TableCell>
                          <TableCell>{salon.name}</TableCell>
                          <TableCell>{salon.ownerName}</TableCell>
                          <TableCell>{salon.email}</TableCell>
                          <TableCell>{salon.phone}</TableCell>
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
