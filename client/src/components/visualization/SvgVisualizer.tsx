import { useState, useEffect } from 'react';
import { RefreshCw, NetworkIcon } from 'lucide-react';

interface SvgVisualizerProps {
  url: string | null;
  fallbackText?: string;
}

export function SvgVisualizer({ url, fallbackText = "No visualization selected" }: SvgVisualizerProps) {
  const [loading, setLoading] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch SVG content when URL changes
  useEffect(() => {
    async function fetchSvg() {
      if (!url) {
        setSvgContent(null);
        setError(null);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load SVG: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        if (text.includes('<svg') || text.includes('<?xml')) {
          setSvgContent(text);
          console.log('[VMB-DEBUG] SVG loaded successfully via fetching content:', url);
        } else {
          throw new Error('Response does not contain valid SVG content');
        }
      } catch (err: any) {
        console.error('[VMB-DEBUG] Failed to load SVG content:', err.message);
        setError(err.message);
        console.log('[VMB-DEBUG] Falling back to direct img tag');
      } finally {
        setLoading(false);
      }
    }
    
    fetchSvg();
  }, [url]);
  
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
        <NetworkIcon className="h-16 w-16 text-gray-300 mb-4" />
        <p>{fallbackText}</p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <RefreshCw className="h-12 w-12 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500">Loading visualization...</p>
      </div>
    );
  }
  
  // If we have SVG content, use dangerouslySetInnerHTML for direct rendering
  if (svgContent) {
    return (
      <div
        className="w-full h-full overflow-auto p-2 bg-white border border-gray-200 rounded-md"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  }
  
  // Fall back to direct image tag if content loading failed
  return (
    <div className="w-full h-full flex items-center justify-center bg-white border border-gray-200 rounded-md p-2">
      <img 
        src={url}
        alt="Code Dependency Graph"
        className="max-w-full max-h-[600px]"
        onError={() => {
          console.error('[VMB-DEBUG] Failed to load SVG via img tag:', url);
          setError('Failed to load visualization');
          
          // Log for debugging
          console.log('[VMB-DEBUG] All SVG rendering approaches failed:', url);
        }}
        onLoad={() => {
          console.log('[VMB-DEBUG] SVG loaded via img tag:', url);
        }}
      />
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90">
          <NetworkIcon className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-red-500 mb-2">Visualization failed to load</p>
          <p className="text-sm text-gray-500">{error}</p>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-4 text-blue-500 hover:underline text-sm"
          >
            Try opening directly in browser
          </a>
        </div>
      )}
    </div>
  );
}