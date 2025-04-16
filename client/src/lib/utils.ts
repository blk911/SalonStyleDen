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
export function getImageUrl(url?: string): string {
  if (!url || url === 'null' || url === 'undefined') {
    console.log('getImageUrl called with empty/undefined URL');
    return '/assets/salon-card.png'; // Return a default placeholder
  }

  console.log('Processing image URL:', url);

  // Clean the URL - sometimes we get strings with quotes
  const cleanUrl = url.trim().replace(/^["']|["']$/g, '');
  
  // If after cleaning it's empty, return default
  if (!cleanUrl) {
    return '/assets/salon-card.png';
  }

  // If it's a data URL, return as is
  if (cleanUrl.startsWith('data:')) {
    return cleanUrl;
  }

  // If it's a proper URL from our uploads directory or assets, return as is with cache busting
  if (cleanUrl.startsWith('/uploads/') || cleanUrl.startsWith('/assets/')) {
    return `${cleanUrl}?t=${Date.now()}`; // Add timestamp to bust cache
  }
  
  // If the URL is missing the leading slash but has uploads/ or assets/
  if (cleanUrl.startsWith('uploads/') || cleanUrl.startsWith('assets/')) {
    return `/${cleanUrl}?t=${Date.now()}`; // Add timestamp to bust cache
  }

  // Handle external URLs - these should be returned as-is
  if (cleanUrl.startsWith('http')) {
    return cleanUrl;
  }

  // Special case for owner photos
  if (cleanUrl.includes('file-')) {
    // This is likely an uploaded file from our server
    return `/uploads/${cleanUrl}?t=${Date.now()}`;
  }

  // Check for the most common issue: url is only the filename without the path
  if (!cleanUrl.includes('/') && !cleanUrl.includes('\\')) {
    // Add uploads path and timestamp to bust cache
    return `/uploads/${cleanUrl}?t=${Date.now()}`;
  }

  // Handle service images based on filename patterns
  if (cleanUrl.toLowerCase().includes('french') || cleanUrl.toLowerCase().includes('tips')) {
    return '/assets/french-tips.png';
  } else if (cleanUrl.toLowerCase().includes('gel') || cleanUrl.toLowerCase().includes('manicure') || cleanUrl.toLowerCase().includes('lux')) {
    return '/assets/gel-manicure.png';
  } else if (cleanUrl.toLowerCase().includes('acrylic') || cleanUrl.toLowerCase().includes('sculpt')) {
    return '/assets/sculpted-acrylics.png';
  } else if (cleanUrl.toLowerCase().includes('custom') || cleanUrl.toLowerCase().includes('design') || cleanUrl.toLowerCase().includes('glam')) {
    return '/assets/glam-design.png';
  } else if (cleanUrl.toLowerCase().includes('spring') || cleanUrl.toLowerCase().includes('seasonal')) {
    return '/assets/salon-card.png';
  }

  // Check for image files and ensure they have the uploads path
  if (cleanUrl.includes('.jpg') || cleanUrl.includes('.png') || cleanUrl.includes('.jpeg') || cleanUrl.includes('.gif')) {
    // Strip any partial paths and just use the filename
    const filename = cleanUrl.split(/[\/\\]/).pop() || cleanUrl;
    return `/uploads/${filename}?t=${Date.now()}`; // Add timestamp to bust cache
  }

  // If the URL has "owner" or related words, it's likely an owner photo
  if (cleanUrl.toLowerCase().includes('owner') || cleanUrl.toLowerCase().includes('salon') || 
      cleanUrl.toLowerCase().includes('profile') || cleanUrl.toLowerCase().includes('photo') || 
      cleanUrl.toLowerCase().includes('tiffany')) {
    return '/assets/salon-card.png'; // Use a salon-specific placeholder
  }
  
  // Log warning if we reached this point - means we couldn't properly handle the URL
  console.warn('Could not process image URL:', cleanUrl);
  
  // Default fallback - use this only for non-owner-photo contexts
  return '/assets/salon-card.png';
}