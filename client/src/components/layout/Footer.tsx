import { Link } from 'wouter';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-6 pb-4">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-playfair text-lg font-semibold mb-2">Ven Me, Baby!</h3>
            <p className="text-gray-300 text-sm">Your premier destination for exceptional hair services and beauty expertise.</p>
            <div className="flex space-x-3 mt-4">
              <a href="#" className="text-gray-300 hover:text-white transition">
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition">
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-3.047v-3.47h3.047v-2.642c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385c5.738-.9 10.126-5.864 10.126-11.854z" />
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition">
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm4.5 8.25v.75h-1.513c-.96 0-1.237.432-1.237 1.057v1.393h2.5l-.333 2.5h-2.167v6.5h-2.5v-6.5h-2.5v-2.5h2.5v-1.693c0-2.338 1.436-3.557 3.5-3.557.96 0 1.789.073 2.03.105v1.945z" />
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition">
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm4.804 9.626c.289 6.389-4.479 13.5-12.958 13.5-2.471 0-4.774-.737-6.702-2.011.318.037.636.056.956.056 2.211 0 4.22-.732 5.86-1.948-2.1-.046-3.855-1.421-4.477-3.313.652.123 1.239.073 1.841-.118-2.141-.427-3.682-2.327-3.682-4.524v-.059c.666.369 1.37.574 2.02.587-1.28-.855-2.102-2.347-2.102-4.011 0-.87.235-1.719.642-2.444 2.339 2.866 5.82 4.686 9.657 4.869-.161-.388-.242-.794-.242-1.212 0-2.565 2.074-4.639 4.639-4.639 1.339 0 2.553.562 3.397 1.464 1.086-.214 2.086-.612 2.993-1.158-.361 1.113-1.113 2.046-2.1 2.637.964-.115 1.99-.392 2.88-.795-.682.955-1.536 1.771-2.522 2.446z" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-lg mb-2">Quick Links</h4>
            <ul className="space-y-1 text-sm text-gray-300">
              <li><Link href="/" className="hover:text-white transition">Home</Link></li>
              <li><Link href="/services" className="hover:text-white transition">Services</Link></li>
              <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
              <li><Link href="/booking" className="hover:text-white transition">Booking</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              <li><Link href="/promos" className="hover:text-white transition">Promotions</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-lg mb-2">Contact Us</h4>
            <address className="not-italic text-sm text-gray-300 space-y-1">
              <p>123 Styling Street</p>
              <p>Beauty District, FL 33140</p>
              <p className="mt-4 flex items-center">
                <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                (555) 123-4567
              </p>
              <p className="flex items-center">
                <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                hello@venmebaby.com
              </p>
            </address>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-6 pt-4 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Ven Me, Baby! All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
