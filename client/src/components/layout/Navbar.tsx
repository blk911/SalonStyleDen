import { useState } from "react";
import { Link } from "wouter";
import BrandName from "@/components/ui/BrandName";

// Placeholder Admin Dashboard component
const AdminDash = () => {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <h2>Clients</h2>
      <div>
        {/* Simple spreadsheet-like layout for clients would go here */}
      </div>
      <h2>Salons</h2>
      <div>
        {/* Simple spreadsheet-like layout for salons would go here */}
      </div>
    </div>
  );
};


export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-soft">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between h-[96px]">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <div className="flex items-center justify-center h-[90px] cursor-pointer relative">
                  <div className="absolute top-2 right-2 flex items-center">
                    <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="ml-2 text-xs text-green-600">Live</span>
                  </div>
                  <img
                    src="/assets/logos/vmb-logo.png"
                    alt="VMB Logo"
                    className="h-[90px] w-auto object-contain"
                    onLoad={() => {/* Logo loaded successfully */}}
                    onError={(e) => {
                      // Hide the image if it fails to load
                      e.currentTarget.style.display = 'none';
                      
                      // Get parent element safely
                      const parent = e.currentTarget.parentElement;
                      if (!parent) return;
                      
                      // Create a div to display the brand name fallback
                      const fallbackDiv = document.createElement('div');
                      fallbackDiv.classList.add('brand-name-fallback');
                      fallbackDiv.innerHTML = '<div class="font-serif text-2xl">Ven Me, <span class="text-[#FF92A5] italic">Baby!</span></div>';
                      
                      // Append the fallback to the parent element
                      parent.appendChild(fallbackDiv);
                    }}
                  />
                </div>
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-4 sm:flex sm:items-center space-x-6">
            <Link href="/">
              <div className="px-2 py-1 text-sm font-medium hover:text-[#FF92A5] cursor-pointer">Home</div>
            </Link>
            <Link href="/salons">
              <div className="px-2 py-1 text-sm font-medium hover:text-[#FF92A5] cursor-pointer">Salons</div>
            </Link>
            <Link href="/clients">
              <div className="px-2 py-1 text-sm font-medium hover:text-[#FF92A5] cursor-pointer">Clients</div>
            </Link>
            {/* VMB Promos link removed as requested */}
            {/* Temporary Admin Button */}
            <Link href="/admin">
              <div className="px-2 py-1 text-sm font-medium bg-pink-50 text-pink-600 hover:bg-pink-100 cursor-pointer">Admin</div>
            </Link>
            <Link href="/network-visualization">
              <div className="px-2 py-1 text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer">Network</div>
            </Link>
            <div className="px-2 py-1 text-sm font-medium hover:text-[#FF92A5] cursor-pointer">About</div>
          </div>
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-1 rounded-md text-gray-700 hover:text-[#FF92A5] focus:outline-none"
              onClick={toggleMobileMenu}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      <div className={`sm:hidden ${mobileMenuOpen ? "block" : "hidden"}`}>
        <div className="px-2 pt-1 pb-2 space-y-1">
          <Link href="/">
            <div className="block px-2 py-1 text-base font-medium hover:text-[#FF92A5] cursor-pointer">Home</div>
          </Link>
          <Link href="/salons">
            <div className="block px-2 py-1 text-base font-medium hover:text-[#FF92A5] cursor-pointer">Salons</div>
          </Link>
          {/* VMB Promos link removed from mobile menu as requested */}
          <Link href="/clients">
            <div className="block px-2 py-1 text-base font-medium hover:text-[#FF92A5] cursor-pointer">Clients</div>
          </Link>
          <Link href="/admin">
            <div className="block px-2 py-1 text-base font-medium bg-pink-50 text-pink-600 hover:bg-pink-100 cursor-pointer">Admin</div>
          </Link>
          <Link href="/network-visualization">
            <div className="block px-2 py-1 text-base font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer">Network</div>
          </Link>
          <div className="block px-2 py-1 text-base font-medium hover:text-[#FF92A5] cursor-pointer">About</div>
        </div>
      </div>
    </nav>
  );
}