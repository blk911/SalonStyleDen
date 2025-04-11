import { useState } from "react";
import { Link } from "wouter";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-soft">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between h-[200px]">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <div className="flex items-center justify-center h-[120px] cursor-pointer">
                  <img 
                    src="/assets/LOGO1.png" 
                    alt="VMB Logo" 
                    className="h-[120px] w-auto object-contain"
                    onLoad={() => console.log("Logo loaded successfully")}
                    onError={(e) => {
                      console.log("Logo failed to load");
                      e.currentTarget.style.display = 'none';
                      // Added a sibling element to display fallback text
                      e.currentTarget.parentNode.insertAdjacentHTML('beforeend', '<div class="font-bold text-2xl text-[#FF92A5]">Ven Me, Baby!</div>');
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
            <Link href="/promos">
              <div className="px-2 py-1 text-sm font-medium hover:text-[#FF92A5] cursor-pointer">VMB Promos</div>
            </Link>
            <div className="px-2 py-1 text-sm font-medium hover:text-[#FF92A5] cursor-pointer">Services</div>
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
          <Link href="/promos">
            <div className="block px-2 py-1 text-base font-medium hover:text-[#FF92A5] cursor-pointer">VMB Promos</div>
          </Link>
          <div className="block px-2 py-1 text-base font-medium hover:text-[#FF92A5] cursor-pointer">Services</div>
          <div className="block px-2 py-1 text-base font-medium hover:text-[#FF92A5] cursor-pointer">About</div>
        </div>
      </div>
    </nav>
  );
}