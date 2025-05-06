
import { Link } from "wouter";

export default function Sitemap() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Site Map</h1>
        
        <div className="space-y-8">
          {/* Root Pages */}
          <section>
            <h2 className="text-xl font-semibold mb-4">/ (Root)</h2>
            <ul className="space-y-2 pl-6 border-l-2 border-pink-200">
              <li><Link href="/" className="text-pink-600 hover:underline">Home Page</Link></li>
              <li><Link href="/promos" className="text-pink-600 hover:underline">Promotions Page</Link></li>
              <li><Link href="/admin" className="text-pink-600 hover:underline font-bold">Admin Dashboard</Link></li>
              <li><Link href="/network-visualization" className="text-pink-600 hover:underline font-bold">Network Visualization</Link></li>
              <li><Link href="/madge-visualization" className="text-pink-600 hover:underline font-bold">Code Dependencies Visualization</Link></li>
            </ul>
          </section>

          {/* Salon Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">/salons</h2>
            <ul className="space-y-2 pl-6 border-l-2 border-pink-200">
              <li><Link href="/salons" className="text-pink-600 hover:underline">Salon Directory</Link></li>
              <li className="pl-4 border-l border-pink-100">
                <span className="text-gray-600">/:id (Dynamic Routes)</span>
                <ul className="pl-4 mt-2 space-y-2">
                  <li>
                    {/* Example path shown for documentation purposes */}
                    <span className="text-gray-600">Public Salon Profile (Example path: /salon/{'{id}'})</span>
                  </li>
                  <li>
                    <span className="text-gray-600">Salon Dashboard (Example path: /dashboard/salon/{'{id}'})</span>
                  </li>
                </ul>
              </li>
            </ul>
          </section>

          {/* Client Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">/client</h2>
            <ul className="space-y-2 pl-6 border-l-2 border-pink-200">
              <li><Link href="/clients" className="text-pink-600 hover:underline">Client Directory</Link></li>
              <li><Link href="/client/register" className="text-pink-600 hover:underline font-bold">Client Registration</Link></li>
              <li><Link href="/client-registration" className="text-pink-600 hover:underline">Client Registration (Alt Path)</Link></li>
              <li><Link href="/register-client" className="text-pink-600 hover:underline">Client Registration (Alt Path 2)</Link></li>
              <li className="pl-4 border-l border-pink-100">
                <span className="text-gray-600">/:id (Dynamic Routes)</span>
                <ul className="pl-4 mt-2">
                  <li>
                    {/* Example path shown for documentation purposes */}
                    <span className="text-gray-600">Client Dashboard (Example path: /client/{'{id}'})</span>
                  </li>
                </ul>
              </li>
            </ul>
          </section>
          
          {/* Registration and Invitation Section - ADDED FOR ENDPOINT VISIBILITY */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-pink-700">Registration & Invitation Routes</h2>
            <ul className="space-y-2 pl-6 border-l-2 border-pink-200">
              <li><Link href="/salon-registration" className="text-pink-600 hover:underline font-bold">Salon Registration</Link></li>
              <li><Link href="/register-salon" className="text-pink-600 hover:underline">Salon Registration (Alt Path)</Link></li>
              <li className="mt-4 pt-2 border-t border-pink-100"><span className="text-gray-700 font-medium">Invitation Routes:</span></li>
              <li><Link href="/invitation/:hash" className="text-pink-600 hover:underline">Invitation View</Link> <span className="text-gray-500 text-sm">(Requires invitation hash)</span></li>
              <li><Link href="/invitation-preview/:hash" className="text-pink-600 hover:underline">Invitation Preview</Link> <span className="text-gray-500 text-sm">(Legacy - use Client Dashboard instead)</span></li>
              <li><Link href="/invitations/by-hash/:hash" className="text-pink-600 hover:underline">Invitation View (Alt Path)</Link> <span className="text-gray-500 text-sm">(Requires invitation hash)</span></li>
              <li><Link href="/complete-invitation/:id" className="text-pink-600 hover:underline">Complete Invitation</Link> <span className="text-gray-500 text-sm">(Requires invitation ID)</span></li>
            </ul>
          </section>

          {/* API Documentation */}
          <section>
            <h2 className="text-xl font-semibold mb-4">/api</h2>
            <ul className="space-y-2 pl-6 border-l-2 border-gray-200 text-sm font-mono">
              <li className="text-gray-600">
                <span className="text-gray-800 font-medium">/salons</span>
                <ul className="pl-4 mt-2 space-y-1">
                  <li>GET - List all salons</li>
                  <li>POST - Create new salon</li>
                  <li>
                    <span>/:id</span>
                    <ul className="pl-4">
                      <li>GET - Get salon details</li>
                      <li>POST /services - Update services</li>
                      <li>POST /promos - Update promotions</li>
                    </ul>
                  </li>
                </ul>
              </li>
              <li className="text-gray-600 mt-4">
                <span className="text-gray-800 font-medium">/clients</span>
                <ul className="pl-4 mt-2 space-y-1">
                  <li>GET - List all clients</li>
                  <li>POST - Register new client</li>
                  <li>
                    <span>/:id</span>
                    <ul className="pl-4">
                      <li>GET - Get client details</li>
                      <li>PUT - Update client details</li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
