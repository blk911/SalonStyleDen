import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { getImageUrl, processApiUrl } from "@/lib/utils";

export default function TestImagePage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [directImageUrl, setDirectImageUrl] = useState("");
  const [processedImageUrl, setProcessedImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState(Date.now());
  
  useEffect(() => {
    if (id) {
      fetch(processApiUrl(`/api/salons/${id}`))
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch salon: ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log("Test page loaded salon data:", data);
          setSalon(data);
          
          if (data.ownerPhotoUrl) {
            setDirectImageUrl(data.ownerPhotoUrl);
            setProcessedImageUrl(getImageUrl(data.ownerPhotoUrl));
          }
        })
        .catch(err => {
          console.error("Error fetching salon:", err);
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  const refreshImage = () => {
    console.log("Refreshing image with new timestamp");
    setTimestamp(Date.now());
    
    // Also force a refetch to get the latest data
    fetch(processApiUrl(`/api/salons/${id}?t=${Date.now()}`))
      .then(response => {
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return response.json();
      })
      .then(freshData => {
        console.log("Refreshed salon data:", freshData);
        setSalon(freshData);
        
        if (freshData.ownerPhotoUrl) {
          setDirectImageUrl(freshData.ownerPhotoUrl);
          setProcessedImageUrl(getImageUrl(freshData.ownerPhotoUrl, 'test_refresh'));
        }
      })
      .catch(err => {
        console.error("Error during refresh:", err);
        setError(err.message);
      });
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (error || !salon) {
    return <div className="p-8 text-center text-red-500">Error: {error || "Failed to load salon"}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Image Test for {salon.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="border p-4 rounded shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Direct URL</h2>
          <p className="text-gray-500 text-sm mb-2 break-all">{directImageUrl || "No photo URL found"}</p>
          
          {directImageUrl && (
            <div className="mt-4">
              <img 
                src={`${directImageUrl}?t=${timestamp}`}
                alt="Direct URL"
                className="w-40 h-40 object-cover border rounded"
                onError={(e) => {
                  console.error("Direct URL image failed to load");
                  e.currentTarget.src = '/assets/salon-card.png';
                }}
              />
            </div>
          )}
        </div>
        
        <div className="border p-4 rounded shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Processed URL with getImageUrl</h2>
          <p className="text-gray-500 text-sm mb-2 break-all">{processedImageUrl || "No processed URL"}</p>
          
          {salon.ownerPhotoUrl && (
            <div className="mt-4">
              <img 
                src={`${processedImageUrl}&t=${timestamp}`}
                alt="Processed URL"
                className="w-40 h-40 object-cover border rounded"
                onError={(e) => {
                  console.error("Processed URL image failed to load");
                  e.currentTarget.src = '/assets/salon-card.png';
                }}
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded shadow-sm mb-8">
        <h2 className="text-lg font-semibold mb-2">Raw Data</h2>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-60">
          {JSON.stringify(salon, null, 2)}
        </pre>
      </div>
      
      <div className="flex gap-4">
        <Button onClick={refreshImage}>Refresh Images</Button>
        <Button variant="outline" onClick={() => setLocation(`/dashboard/salon/${id}`.replace(/\/\//g, '/'))}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
