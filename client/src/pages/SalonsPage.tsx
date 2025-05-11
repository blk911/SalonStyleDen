import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, useLoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { queryClient } from "@/lib/queryClient";
import BrandName from "../components/ui/BrandName";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn, formatPhoneNumber } from "@/lib/utils";

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

// Define location item for search
interface LocationItem {
  value: string;
  label: string;
  type: "state" | "city" | "zip";
  state?: string;
}

// Predefined location options
const locationOptions: LocationItem[] = [
  // States
  { value: "CO", label: "Colorado", type: "state" },
  { value: "NM", label: "New Mexico", type: "state" },
  { value: "TX", label: "Texas", type: "state" },
  { value: "OK", label: "Oklahoma", type: "state" },
  { value: "WY", label: "Wyoming", type: "state" },

  // Colorado Cities
  { value: "Denver", label: "Denver", type: "city", state: "CO" },
  { value: "Fort Collins", label: "Fort Collins", type: "city", state: "CO" },
  { value: "Colorado Springs", label: "Colorado Springs", type: "city", state: "CO" },
  { value: "Pueblo", label: "Pueblo", type: "city", state: "CO" },
  { value: "Lakewood", label: "Lakewood", type: "city", state: "CO" },
  { value: "Lone Tree", label: "Lone Tree", type: "city", state: "CO" },
  { value: "Greenwood Village", label: "Greenwood Village", type: "city", state: "CO" },
  { value: "Englewood", label: "Englewood", type: "city", state: "CO" },

  // Wyoming Cities
  { value: "Cheyenne", label: "Cheyenne", type: "city", state: "WY" },

  // Common ZIP codes
  { value: "80014", label: "80014 - Aurora", type: "zip", state: "CO" },
  { value: "80202", label: "80202 - Downtown Denver", type: "zip", state: "CO" },
  { value: "80238", label: "80238 - Stapleton", type: "zip", state: "CO" },
  { value: "80301", label: "80301 - Boulder", type: "zip", state: "CO" },
];

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

// Custom marker icon - will be defined after Google Maps is loaded
let markerIcon: any = null;

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
  const { 
    data: salons, 
    isLoading, 
    error,
    refetch 
  } = useQuery<SalonType[]>({
    queryKey: ["/api/salons"],
    refetchOnWindowFocus: true,
    staleTime: 15000, // Consider data fresh for 15 seconds
  });
  
  // Set up window focus handling for real-time data refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('SalonsPage - Window focused, refreshing data');
        // Invalidate the query cache
        queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
        console.log('SalonsPage - Invalidated salons cache');
      }
    };

    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // State to track which salon cards are expanded
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});

  // State to toggle map visibility - hidden by default
  const [showMap, setShowMap] = useState<boolean>(false);

  // State for selected marker in Google Maps
  const [selectedSalon, setSelectedSalon] = useState<SalonType | null>(null);

  // State for salon markers
  const [salonMarkers, setSalonMarkers] = useState<Array<{id: number, name: string, position: {lat: number, lng: number}}>>([]);
  
  // State to track which salon is being hovered over
  const [hoveredSalon, setHoveredSalon] = useState<number | null>(null);

  // State for location selection
  const [selectedLocation, setSelectedLocation] = useState<string>("Denver");
  const [isLocationOpen, setIsLocationOpen] = useState(false);

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

    // Initialize the marker icon now that Google Maps is loaded
    markerIcon = {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
          <path d="M12,2C8.4,2,6,3.4,6,8v12c0,2.2,2.6,4,6,4s6-1.8,6-4V8C18,3.4,15.6,2,12,2z M12,4c1.6,0,2.6,0.4,3.2,1H8.8 C9.4,4.4,10.4,4,12,4z M16,20c0,1.1-1.8,2-4,2s-4-0.9-4-2v-2h8V20z M16,16H8V8h8V16z" fill="#662b39" stroke="#ffffff" stroke-width="2"/>
          <circle cx="12" cy="12" r="4" fill="#FF92A5" stroke="#ffffff" stroke-width="1"/>
        </svg>
      `),
      scaledSize: new google.maps.Size(40, 40),
      anchor: new google.maps.Point(20, 40),
      labelOrigin: new google.maps.Point(12, 10)
    };
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
    // Show map when search is performed
    if (!showMap) {
      setShowMap(true);
    }

    if (selectedLocation) {
      // Find the selected location in options to get state if needed
      const locationOption = locationOptions.find(option => option.value === selectedLocation);
      const state = locationOption?.state || "CO"; // Default to CO if not found

      geocodeAddress(`${selectedLocation}, ${state}`).then(location => {
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
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-pink-100 to-pink-50 border-b border-pink-200" style={{ height: "150px" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative h-full flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-pink-800">
              <BrandName size="3xl" className="mr-1" inline />
              <span>Salons</span>
            </h1>
            <p className="mt-2 text-gray-600">Find premium nail salons near you</p>
            <button
              onClick={() => refetch()}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs flex items-center gap-1 text-pink-600 hover:text-pink-800 bg-pink-50 hover:bg-pink-100 px-2 py-1 rounded-md"
              title="Refresh salon list"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 21h5v-5"></path></svg>
              Refresh
            </button>
          </div>
        </section>
        
        <div className="container mx-auto px-2 py-2">
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
                  {/* Location Combobox */}
                  <div className="mb-4">
                    <label className="block text-xs text-gray-600 mb-1">Location (City, ZIP, or State)</label>
                    <Popover open={isLocationOpen} onOpenChange={setIsLocationOpen}>
                      <div className="flex">
                        <PopoverTrigger asChild>
                          <button
                            role="combobox"
                            aria-expanded={isLocationOpen}
                            className="flex-1 flex items-center justify-between rounded-l-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm focus:outline-none hover:bg-slate-50"
                          >
                            {selectedLocation || "Select location..."}
                            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                          </button>
                        </PopoverTrigger>
                        <button
                          onClick={handleSearch}
                          className="bg-[#FF92A5] hover:bg-[#ff7a92] text-white px-3 py-2 rounded-r-md text-xs"
                        >
                          Go
                        </button>
                      </div>
                      <PopoverContent className="w-[200px] p-0 max-h-[280px] overflow-auto">
                        <Command>
                          <CommandInput placeholder="Search location..." className="h-9 text-xs" />
                          <CommandList>
                            <CommandEmpty>No location found.</CommandEmpty>
                            <CommandGroup heading="States">
                              {locationOptions
                                .filter((option) => option.type === "state")
                                .map((option) => (
                                  <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={(currentValue) => {
                                      setSelectedLocation(currentValue);
                                      setIsLocationOpen(false);
                                      handleSearch();
                                    }}
                                    className="text-xs"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-3 w-3",
                                        selectedLocation === option.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {option.label}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                            <CommandGroup heading="Cities">
                              {locationOptions
                                .filter((option) => option.type === "city")
                                .map((option) => (
                                  <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={(currentValue) => {
                                      setSelectedLocation(currentValue);
                                      setIsLocationOpen(false);
                                      handleSearch();
                                    }}
                                    className="text-xs"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-3 w-3",
                                        selectedLocation === option.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {option.label} {option.state && `(${option.state})`}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                            <CommandGroup heading="ZIP Codes">
                              {locationOptions
                                .filter((option) => option.type === "zip")
                                .map((option) => (
                                  <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={(currentValue) => {
                                      setSelectedLocation(currentValue);
                                      setIsLocationOpen(false);
                                      handleSearch();
                                    }}
                                    className="text-xs"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-3 w-3",
                                        selectedLocation === option.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {option.label}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
                        <input type="checkbox" id="filter-nails" className="mr-2 h-3 w-3" />
                        <label htmlFor="filter-nails" className="text-xs text-gray-600">Nails</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="filter-manpedi" className="mr-2 h-3 w-3" />
                        <label htmlFor="filter-manpedi" className="text-xs text-gray-600">Mani/Pedi</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="filter-hair" className="mr-2 h-3 w-3" />
                        <label htmlFor="filter-hair" className="text-xs text-gray-600">Hair Stylist</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="filter-massage" className="mr-2 h-3 w-3" />
                        <label htmlFor="filter-massage" className="text-xs text-gray-600">Massage</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="filter-dayspa" className="mr-2 h-3 w-3" />
                        <label htmlFor="filter-dayspa" className="text-xs text-gray-600">Day Spa</label>
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
                      options={{
                        scrollwheel: true,
                        zoomControl: true,
                        streetViewControl: false,
                        draggable: true,
                        mapTypeControl: false,
                        fullscreenControl: true,
                      }}
                    >
                      {salonMarkers.map((marker) => (
                        <Marker
                          key={marker.id}
                          position={marker.position}
                          icon={markerIcon}
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
            {salons?.sort((a, b) => {
              // Prioritize any salon with "Tiffany" in the name or owner name
              const aTiffany = (a.name.toLowerCase().includes('tiffany') || a.ownerName.toLowerCase().includes('tiffany'));
              const bTiffany = (b.name.toLowerCase().includes('tiffany') || b.ownerName.toLowerCase().includes('tiffany'));

              // If one has Tiffany and the other doesn't, the one with Tiffany comes first
              if (aTiffany && !bTiffany) return -1;
              if (!aTiffany && bTiffany) return 1;

              // Otherwise, sort by name
              return a.name.localeCompare(b.name);
            }).map((salon) => (
              <div 
                key={salon.id} 
                className={`border-b border-gray-200 py-2 first:pt-0 last:border-b-0 transition-colors duration-200 ${
                  salon.name.toLowerCase().includes('tiffany') || salon.ownerName.toLowerCase().includes('tiffany') 
                    ? 'bg-[#FFF0F5] rounded-md shadow-sm border border-pink-200 my-1 p-2' 
                    : hoveredSalon === salon.id ? 'bg-pink-50 rounded-md p-2' : ''
                }`}
                onMouseEnter={() => setHoveredSalon(salon.id)}
                onMouseLeave={() => setHoveredSalon(null)}
              >
                <div className="cursor-pointer" onClick={() => toggleCard(salon.id)}>
                  {/* Header section - always visible with salon name, owner, and phone on the same line */}
                  <div className="flex flex-wrap items-center justify-between w-full">
                    <div className="flex flex-1 items-center gap-2 overflow-hidden">
                      <div className="flex items-center">
                        <h3 className="font-bold text-base leading-tight text-[#FF92A5] truncate">{salon.name}</h3>
                        {(salon.name.toLowerCase().includes('tiffany') || salon.ownerName.toLowerCase().includes('tiffany')) && (
                          <Badge className="ml-2 bg-[#FF92A5] text-white text-[10px] py-0">Book Now</Badge>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-gray-600 whitespace-nowrap">
                        <span className="mx-1 text-gray-300">|</span>
                        <span className="mr-1">{salon.ownerName}</span> 
                        <span className="mr-1">•</span>
                        <span className="truncate">{formatPhoneNumber(salon.phone)}</span>
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

                      {/* Ven Me, Baby! Style Options - Hidden for now */}
                      {/* <div className="section-divider">
                        <h4 className="font-bold text-sm mb-2 text-[#FF92A5]">Ven Me, Baby! Style Options</h4>
                      </div> */}

                      {/* View salon button */}
                      <div className="button-container">
                        <Link href={`/salon/${salon.id}`}>
                          <div className="bg-[#FF92A5] hover:bg-[#ff7a92] text-white text-center text-xs py-1 px-2 rounded-sm inline-block cursor-pointer">
                            Visit My Page
                          </div>
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
              <div className="inline-block px-3 py-1 bg-[#FF92A5] text-white rounded hover:bg-[#ff7a92] transition-colors text-xs cursor-pointer">
                Register Your Salon
              </div>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}