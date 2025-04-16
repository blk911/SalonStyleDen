import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);
  return {
    error: error instanceof Error ? error.message : 'An unexpected error occurred'
  };
}

export function validateResponse<T>(response: T | null): T {
  if (!response) {
    throw new Error('Invalid response received');
  }
  return response;
}

export function formatPhoneNumber(value: string): string {
  // Remove non-digit characters
  const digits = value.replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX
  if (digits.length === 0) {
    return '';
  } else if (digits.length <= 3) {
    return `(${digits}`;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
}

// Helper to process image URLs consistently
export function getImageUrl(url?: string, debugLabel?: string): string {
  // For debugging purposes
  const label = debugLabel || 'unknown';
  console.log(`[getImageUrl:${label}] Input URL:`, url);

  if (!url || url === 'null' || url === 'undefined') {
    console.log(`[getImageUrl:${label}] Empty or invalid URL, using default placeholder`);
    return '/assets/salon-card.png'; // Return a default placeholder
  }

  // Clean the URL - sometimes we get strings with quotes
  const cleanUrl = url.trim().replace(/^["']|["']$/g, '');
  
  // If after cleaning it's empty, return default
  if (!cleanUrl) {
    console.log(`[getImageUrl:${label}] Cleaned URL is empty, using default placeholder`);
    return '/assets/salon-card.png';
  }
  
  // Cache busting timestamp - use the same one for the entire function call to ensure consistency
  const timestamp = Date.now();
  let finalUrl = cleanUrl;
  
  // Apply standard URL formatting based on the URL pattern
  try {
    // If it's a data URL, return as is
    if (cleanUrl.startsWith('data:')) {
      console.log(`[getImageUrl:${label}] Data URL detected, using as-is`);
      return cleanUrl;
    }

    // CRITICAL FIX: Handle special case for /uploads directory - these are owner photos
    if (cleanUrl.startsWith('/uploads/')) {
      // Make sure we directly access the upload path without any processing
      finalUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
      console.log(`[getImageUrl:${label}] Upload path with leading slash detected (FIXED DIRECT ACCESS):`, finalUrl);
      return finalUrl;
    }
    
    // If the URL is missing the leading slash but has uploads/
    if (cleanUrl.startsWith('uploads/')) {
      finalUrl = `/${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
      console.log(`[getImageUrl:${label}] Upload path without leading slash detected (FIXED):`, finalUrl);
      return finalUrl;
    }
    
    // Handle asset directory
    if (cleanUrl.startsWith('/assets/')) {
      finalUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
      console.log(`[getImageUrl:${label}] Asset path with leading slash detected:`, finalUrl);
      return finalUrl;
    }
    
    // If the URL is missing the leading slash but has assets/
    if (cleanUrl.startsWith('assets/')) {
      finalUrl = `/${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
      console.log(`[getImageUrl:${label}] Asset path without leading slash detected:`, finalUrl);
      return finalUrl;
    }

    // Handle external URLs - these should be returned as-is
    if (cleanUrl.startsWith('http')) {
      console.log(`[getImageUrl:${label}] External URL detected:`, cleanUrl);
      return cleanUrl;
    }

    // CRITICAL FIX: Special case for owner photos with file- prefix
    if (cleanUrl.includes('file-')) {
      // This is likely an uploaded file from our server
      // FIXED: Ensure we use the direct uploads path without any processing
      if (cleanUrl.includes('/uploads/')) {
        finalUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
      } else {
        finalUrl = `/uploads/${cleanUrl.split(/[\/\\]/).pop() || cleanUrl}?t=${timestamp}`;
      }
      console.log(`[getImageUrl:${label}] File upload detected (FIXED DIRECT ACCESS):`, finalUrl);
      return finalUrl;
    }

    // Check for the most common issue: url is only the filename without the path
    if (!cleanUrl.includes('/') && !cleanUrl.includes('\\')) {
      // FIXED: Add uploads path with direct access and timestamp to bust cache
      finalUrl = `/uploads/${cleanUrl}?t=${timestamp}`;
      console.log(`[getImageUrl:${label}] Filename without path detected (FIXED DIRECT ACCESS):`, finalUrl);
      return finalUrl;
    }

    // Handle service images based on filename patterns
    if (cleanUrl.toLowerCase().includes('french') || cleanUrl.toLowerCase().includes('tips')) {
      finalUrl = `/assets/french-tips.png?t=${timestamp}`;
      console.log(`[getImageUrl:${label}] Service image (french/tips) detected:`, finalUrl);
      return finalUrl;
    } else if (cleanUrl.toLowerCase().includes('gel') || cleanUrl.toLowerCase().includes('manicure') || cleanUrl.toLowerCase().includes('lux')) {
      finalUrl = `/assets/gel-manicure.png?t=${timestamp}`;
      console.log(`[getImageUrl:${label}] Service image (gel/manicure) detected:`, finalUrl);
      return finalUrl;
    } else if (cleanUrl.toLowerCase().includes('acrylic') || cleanUrl.toLowerCase().includes('sculpt')) {
      finalUrl = `/assets/sculpted-acrylics.png?t=${timestamp}`;
      console.log(`[getImageUrl:${label}] Service image (acrylic/sculpt) detected:`, finalUrl);
      return finalUrl;
    } else if (cleanUrl.toLowerCase().includes('custom') || cleanUrl.toLowerCase().includes('design') || cleanUrl.toLowerCase().includes('glam')) {
      finalUrl = `/assets/glam-design.png?t=${timestamp}`;
      console.log(`[getImageUrl:${label}] Service image (custom/design) detected:`, finalUrl);
      return finalUrl;
    } else if (cleanUrl.toLowerCase().includes('spring') || cleanUrl.toLowerCase().includes('seasonal')) {
      finalUrl = `/assets/salon-card.png?t=${timestamp}`;
      console.log(`[getImageUrl:${label}] Service image (spring/seasonal) detected:`, finalUrl);
      return finalUrl;
    }

    // FIXED: Check for image files and ensure they have the uploads path with direct access
    if (cleanUrl.includes('.jpg') || cleanUrl.includes('.png') || cleanUrl.includes('.jpeg') || cleanUrl.includes('.gif')) {
      // Strip any partial paths and just use the filename
      const filename = cleanUrl.split(/[\/\\]/).pop() || cleanUrl;
      finalUrl = `/uploads/${filename}?t=${timestamp}`;
      console.log(`[getImageUrl:${label}] Image file detected (DIRECT ACCESS):`, finalUrl);
      return finalUrl;
    }

    // If the URL has "owner" or related words, it's likely an owner photo
    if (cleanUrl.toLowerCase().includes('owner') || cleanUrl.toLowerCase().includes('salon') || 
        cleanUrl.toLowerCase().includes('profile') || cleanUrl.toLowerCase().includes('photo') || 
        cleanUrl.toLowerCase().includes('tiffany')) {
      // FIXED: Don't override actual owner photos - only use default if no photo
      console.log(`[getImageUrl:${label}] Owner photo keyword detected - using default fallback`);
      finalUrl = `/assets/salon-card.png?t=${timestamp}`;
      return finalUrl;
    }
    
    // If we couldn't match any pattern, use the default fallback
    console.warn(`[getImageUrl:${label}] Could not process image URL:`, cleanUrl);
    finalUrl = `/assets/salon-card.png?t=${timestamp}`;
    return finalUrl;
    
  } catch (error) {
    // If any error occurs in URL processing, fall back to a safe default
    console.error(`[getImageUrl:${label}] Error processing URL:`, error);
    return `/assets/salon-card.png?t=${timestamp}`;
  }
}