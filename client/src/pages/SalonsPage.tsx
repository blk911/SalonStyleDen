import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, useLoadScript, Marker, InfoWindow } from "@react-google-maps/api";

// Define social media item interface
interface SocialMediaItem {
  platform: string;
  handle: string;
}

// Define our own Salon type for the frontend
interface SalonType {
  id: number;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  socialMedia?: SocialMediaItem[] | null;
  type: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  createdAt: string;
}

// Libraries for Google Maps
const libraries = ["places"];

// Map options
const mapContainerStyle = {
  width: "100%",
  height: "400px"
};

// Default center coordinates for Denver Metro Area
const defaultCenter = {
  lat: 39.7392,
  lng: -104.9903
};

// Default zoom level
const defaultZoom = 11;

// Geocode an address to get coordinates
const geocodeAddress = async (address: string): Promise<{lat: number, lng: number} | null> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyBeTURHmJiWYtMEvtShDlCCEXr6lDu7obE`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
    return null;
  } catch (error) {
    console.error("Error geocoding address:", error);
    return null;
  }
};

export default function SalonsPage() {
  const { data: salons, isLoading, error } = useQuery<SalonType[]>({
    queryKey: ["/api/salons"],
  });
  
  // State to track which salon cards are expanded
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  
  // State to toggle map visibility
  const [showMap, setShowMap] = useState<boolean>(true);
  
  // State for selected marker in Google Maps
  const [selectedSalon, setSelectedSalon] = useState<SalonType | null>(null);

  // State for salon markers
  const [salonMarkers, setSalonMarkers] = useState<Array<{id: number, name: string, position: {lat: number, lng: number}}>>([]);
  
  // State for search input
  const [searchZip, setSearchZip] = useState<string>("Denver");

  // Load Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyBeTURHmJiWYtMEvtShDlCCEXr6lDu7obE",
    libraries: libraries as any,
  });

  // Reference to map instance
  const mapRef = useRef<google.maps.Map | null>(null);
  
  // Callback when map loads
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Toggle function for expanding/collapsing salon details
  const toggleCard = (salonId: number) => {
    setExpandedCards(prev => ({
      ...prev,
      [salonId]: !prev[salonId]
    }));
  };
  
  // Toggle map visibility
  const toggleMap = () => {
    setShowMap(prev => !prev);
  };

  // Handle search
  const handleSearch = () => {
    if (searchZip) {
      geocodeAddress(`${searchZip}, CO`).then(location => {
        if (location && mapRef.current) {
          mapRef.current.panTo({ lat: location.lat, lng: location.lng });
          mapRef.current.setZoom(13);
        }
      });
    }
  };

  // Effect to geocode salon addresses when salons data is loaded
  useEffect(() => {
    if (salons && salons.length > 0) {
      const geocodeAndSetMarkers = async () => {
        const markers = await Promise.all(
          salons.map(async (salon) => {
            const fullAddress = `${salon.address}, ${salon.city}, ${salon.state} ${salon.zipCode}`;
            const position = await geocodeAddress(fullAddress);
            
            if (position) {
              return {
                id: salon.id,
                name: salon.name,
                position
              };
            }
            return null;
          })
        );
        
        // Filter out null values and set markers
        setSalonMarkers(markers.filter(Boolean) as any);
      };
      
      geocodeAndSetMarkers();
    }
  }, [salons]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-2 py-2">
          <h1 className="text-xl font-bold mb-1 text-center text-[#FF92A5]">Den Be Baby! Salons</h1>
          <Separator className="my-1" />
          
          {/* Map Feature Section with Toggle */}
          <div className="bg-white rounded-lg shadow-sm border border-pink-100 my-3 overflow-hidden">
            {/* Map Header with Toggle Button */}
            <div className="bg-[#FFE8EC] px-3 py-2 flex justify-between items-center">
              <h2 className="text-sm font-bold text-[#FF92A5] uppercase tracking-wide">FIND SALONS</h2>
              <button 
                onClick={toggleMap}
                className="text-[10px] text-gray-500 hover:text-gray-700 flex items-center"
              >
                {showMap ? '▲ HIDE MAP' : '▼ SHOW MAP'}
              </button>
            </div>
            
            {/* Collapsible Map Content */}
            {showMap && (
              <div className="flex flex-col md:flex-row">
                {/* Left Column - Map Controls */}
                <div className="w-full md:w-1/3 p-3 border-r border-pink-100">
                  {/* Search Input */}
                  <div className="mb-3">
                    <input 
                      type="text" 
                      value={searchZip}
                      onChange={(e) => setSearchZip(e.target.value)}
                      placeholder="Enter zip code or city..." 
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-pink-300"
                    />
                  </div>
                  
                  {/* Distance Filter */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">Distance</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-pink-300"
                      defaultValue="10"
                    >
                      <option value="5">Within 5 miles</option>
                      <option value="10">Within 10 miles</option>
                      <option value="15">Within 15 miles</option>
                      <option value="25">Within 25 miles</option>
                    </select>
                  </div>
                  
                  {/* Filter Options */}
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-600 mb-1">Filter By Services</h4>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <input type="checkbox" id="filter-manicure" className="mr-2 h-3 w-3" />
                        <label htmlFor="filter-manicure" className="text-xs text-gray-600">Manicure</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="filter-pedicure" className="mr-2 h-3 w-3" />
                        <label htmlFor="filter-pedicure" className="text-xs text-gray-600">Pedicure</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="filter-gel" className="mr-2 h-3 w-3" />
                        <label htmlFor="filter-gel" className="text-xs text-gray-600">Gel Polish</label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Apply Button */}
                  <button 
                    onClick={handleSearch}
                    className="w-full bg-[#FF92A5] hover:bg-[#ff7a92] text-white text-xs py-2 rounded-md"
                  >
                    Search Salons
                  </button>
                </div>
                
                {/* Right Column - Map Display */}
                <div className="w-full md:w-2/3 h-64 md:h-[400px]">
                  {loadError && (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <p className="text-red-500 text-sm">Error loading Google Maps. Please try again later.</p>
                    </div>
                  )}
                  
                  {!isLoaded && (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <p className="text-gray-500 text-sm">Loading map...</p>
                    </div>
                  )}
                  
                  {isLoaded && (
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      zoom={defaultZoom}
                      center={defaultCenter}
                      onLoad={onMapLoad}
                    >
                      {salonMarkers.map((marker) => (
                        <Marker
                          key={marker.id}
                          position={marker.position}
                          onClick={() => {
                            const salon = salons?.find(s => s.id === marker.id);
                            if (salon) setSelectedSalon(salon);
                          }}
                        />
                      ))}
                      
                      {selectedSalon && (
                        <InfoWindow
                          position={salonMarkers.find(m => m.id === selectedSalon.id)?.position as google.maps.LatLngLiteral}
                          onCloseClick={() => setSelectedSalon(null)}
                        >
                          <div className="p-1">
                            <h3 className="font-bold text-sm text-[#FF92A5]">{selectedSalon.name}</h3>
                            <p className="text-xs mt-1">{selectedSalon.address}</p>
                            <p className="text-xs">{selectedSalon.city}, {selectedSalon.state} {selectedSalon.zipCode}</p>
                            <p className="text-xs mt-1">{selectedSalon.phone}</p>
                            <Link href={`/salon/${selectedSalon.id}`}>
                              <a className="text-[10px] text-blue-500 hover:text-blue-700">
                                View Salon Page
                              </a>
                            </Link>
                          </div>
                        </InfoWindow>
                      )}
                    </GoogleMap>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {isLoading && (
            <div className="flex justify-center items-center h-16 text-sm">
              <p className="text-gray-500">Loading salons...</p>
            </div>
          )}
          
          {error && (
            <div className="flex justify-center items-center h-16 text-sm">
              <p className="text-red-500">Error loading salons. Please try again later.</p>
            </div>
          )}
          
          {salons && salons.length === 0 && (
            <div className="flex justify-center items-center h-16 text-sm">
              <p className="text-gray-500">No salons available at the moment. Check back soon!</p>
            </div>
          )}
          
          <div className="flex flex-col space-y-1 mt-2">
            {salons?.map((salon) => (
              <div 
                key={salon.id} 
                className="border-b border-gray-200 py-2 first:pt-0 last:border-b-0"
              >
                <div className="cursor-pointer" onClick={() => toggleCard(salon.id)}>
                  {/* Header section - always visible with salon name, owner, and phone on the same line */}
                  <div className="flex flex-wrap items-center justify-between w-full">
                    <div className="flex flex-1 items-center gap-2 overflow-hidden">
                      <h3 className="font-bold text-base leading-tight text-[#FF92A5] truncate">{salon.name}</h3>
                      <div className="flex items-center text-xs text-gray-600 whitespace-nowrap">
                        <span className="mx-1 text-gray-300">|</span>
                        <span className="mr-1">{salon.ownerName}</span> 
                        <span className="mr-1">•</span>
                        <span className="truncate">{salon.phone}</span>
                      </div>
                    </div>
                    <button 
                      className="text-[10px] text-gray-400 hover:text-gray-600 w-8 text-center ml-1" 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCard(salon.id);
                      }}
                    >
                      {expandedCards[salon.id] ? '▲ hide' : '▼ show'}
                    </button>
                  </div>
                  
                  {/* Expandable content - conditionally visible */}
                  {expandedCards[salon.id] && (
                    <>
                      {/* Email and social media - centered */}
                      <div className="content-section section-divider">
                        <span>{salon.email}</span>
                        
                        {salon.socialMedia && Array.isArray(salon.socialMedia) && salon.socialMedia.length > 0 && (
                          <>
                            {salon.socialMedia.map((item, index) => (
                              <Badge key={index} variant="outline" className="text-mini py-0 px-1 bg-white border-pink-200 text-pink-700">
                                {item.platform}: {item.handle}
                              </Badge>
                            ))}
                          </>
                        )}
                      </div>
                      
                      {/* Promo placeholder container - 3 columns */}
                      <div className="section-divider">
                        <div className="grid-cols-responsive">
                          {/* Promo 1 */}
                          <div className="border border-pink-100 rounded overflow-hidden shadow-sm h-[100px]">
                            <div className="bg-[#FEE1E8] h-12 flex items-center justify-center">
                              <span className="text-micro">Promo Image</span>
                            </div>
                            <div className="card-content">
                              <h5 className="font-medium text-mini">Summer Special</h5>
                              <p className="text-micro">20% off manicures</p>
                            </div>
                          </div>
                          
                          {/* Promo 2 */}
                          <div className="border border-pink-100 rounded overflow-hidden shadow-sm h-[100px]">
                            <div className="bg-[#FEE1E8] h-12 flex items-center justify-center">
                              <span className="text-micro">Promo Image</span>
                            </div>
                            <div className="card-content">
                              <h5 className="font-medium text-mini">New Clients</h5>
                              <p className="text-micro">Free nail art</p>
                            </div>
                          </div>
                          
                          {/* Promo 3 */}
                          <div className="border border-pink-100 rounded overflow-hidden shadow-sm h-[100px]">
                            <div className="bg-[#FEE1E8] h-12 flex items-center justify-center">
                              <span className="text-micro">Promo Image</span>
                            </div>
                            <div className="card-content">
                              <h5 className="font-medium text-mini">Friends Deal</h5>
                              <p className="text-micro">25% off for 2+</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* View salon button */}
                      <div className="button-container">
                        <Link href={`/salon/${salon.id}`}>
                          <a className="bg-[#FF92A5] hover:bg-[#ff7a92] text-white text-center text-xs py-1 px-2 rounded-sm inline-block">
                            View {salon.name} BEN ME, BABY! PAGE
                          </a>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 mb-2 text-center">
            <p className="text-xs mb-2">Join our network of professional salons today!</p>
            <Link href="/">
              <a className="inline-block px-3 py-1 bg-[#FF92A5] text-white rounded hover:bg-[#ff7a92] transition-colors text-xs">
                Register Your Salon
              </a>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}