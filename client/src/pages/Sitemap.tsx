
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
                  <li><Link href="/salons/1" className="text-pink-600 hover:underline">Public Salon Profile</Link></li>
                  <li><Link href="/dashboard/salon/1" className="text-pink-600 hover:underline">Salon Dashboard</Link></li>
                </ul>
              </li>
            </ul>
          </section>

          {/* Client Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">/client</h2>
            <ul className="space-y-2 pl-6 border-l-2 border-pink-200">
              <li className="pl-4 border-l border-pink-100">
                <span className="text-gray-600">/:id (Dynamic Routes)</span>
                <ul className="pl-4 mt-2">
                  <li><Link href="/client/1" className="text-pink-600 hover:underline">Client Dashboard</Link></li>
                </ul>
              </li>
            </ul>
          </section>

          {/* Promotions Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">/promos</h2>
            <ul className="space-y-2 pl-6 border-l-2 border-pink-200">
              <li><Link href="/promos" className="text-pink-600 hover:underline">Promotions Page</Link></li>
            </ul>
          </section>

          {/* API Endpoints */}
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
