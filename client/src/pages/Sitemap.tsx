
import { Link } from "wouter";

export default function Sitemap() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Sitemap</h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Main Pages</h2>
            <ul className="space-y-2">
              <li><Link href="/" className="text-pink-600 hover:underline">Home</Link></li>
              <li><Link href="/salons" className="text-pink-600 hover:underline">Find Salons</Link></li>
              <li><Link href="/promos" className="text-pink-600 hover:underline">Promotions</Link></li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-4">User Areas</h2>
            <ul className="space-y-2">
              <li><Link href="/dashboard/salon/1" className="text-pink-600 hover:underline">Salon Dashboard</Link></li>
              <li><Link href="/client/1" className="text-pink-600 hover:underline">Client Dashboard</Link></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
