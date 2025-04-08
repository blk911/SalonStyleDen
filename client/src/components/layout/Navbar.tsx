import { useState } from "react";
import { Link } from "wouter";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  return (
    <nav className="bg-white shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <a className="font-playfair font-bold text-2xl text-[#FF92A5]">Den Be Baby!</a>
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-8">
            <Link href="/">
              <a className="px-3 py-2 text-sm font-medium hover:text-[#FF92A5]">Home</a>
            </Link>
            <a href="#" className="px-3 py-2 text-sm font-medium hover:text-[#FF92A5]">Services</a>
            <a href="#" className="px-3 py-2 text-sm font-medium hover:text-[#FF92A5]">About</a>
            <a href="#" className="px-3 py-2 text-sm font-medium hover:text-[#FF92A5]">Contact</a>
          </div>
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-[#FF92A5] focus:outline-none"
              onClick={toggleMobileMenu}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      <div className={`sm:hidden ${mobileMenuOpen ? "block" : "hidden"}`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link href="/">
            <a className="block px-3 py-2 text-base font-medium hover:text-[#FF92A5]">Home</a>
          </Link>
          <a href="#" className="block px-3 py-2 text-base font-medium hover:text-[#FF92A5]">Services</a>
          <a href="#" className="block px-3 py-2 text-base font-medium hover:text-[#FF92A5]">About</a>
          <a href="#" className="block px-3 py-2 text-base font-medium hover:text-[#FF92A5]">Contact</a>
        </div>
      </div>
    </nav>
  );
}
