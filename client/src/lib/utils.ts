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
  if (!url) return '';
  
  // If it's a data URL, return as is (should never happen in production)
  if (url.startsWith('data:')) {
    console.log('Warning: Data URL encountered, this should be uploaded:', url.substring(0, 30) + '...');
    return url;
  }
  
  // If it's a proper URL from our uploads directory or assets, return as is
  if (url.startsWith('/uploads/') || url.startsWith('/assets/')) {
    return url;
  }
  
  // Handle external URLs - replace with our local assets
  if (url.startsWith('http')) {
    // Match service type from the URL if possible
    if (url.toLowerCase().includes('french') || url.toLowerCase().includes('tips')) {
      return '/assets/french-tips.png';
    } else if (url.toLowerCase().includes('gel') || url.toLowerCase().includes('manicure')) {
      return '/assets/gel-manicure.png';
    } else if (url.toLowerCase().includes('acrylic') || url.toLowerCase().includes('sculpt')) {
      return '/assets/sculpted-acrylics.png';
    } else if (url.toLowerCase().includes('custom') || url.toLowerCase().includes('design') || url.toLowerCase().includes('glam')) {
      return '/assets/glam-design.png';
    }
    
    // Default fallback for external URLs
    return '/assets/salon-card.png';
  }
  
  // Handle Windows paths (convert to web URLs)
  if (url.includes(':\\') || url.includes('C:')) {
    console.log('Converting Windows path to local asset:', url);
    // Extract just the filename from the Windows path
    const filename = url.split('\\').pop()?.toLowerCase() || '';
    
    if (filename.includes('french') || filename.includes('tips')) {
      return '/assets/french-tips.png';
    } else if (filename.includes('gel') || filename.includes('manicure')) {
      return '/assets/gel-manicure.png';
    } else if (filename.includes('acrylic') || filename.includes('sculpt')) {
      return '/assets/sculpted-acrylics.png';
    } else if (filename.includes('custom') || filename.includes('design') || filename.includes('glam')) {
      return '/assets/glam-design.png';
    }
    
    // If we can't match the filename, use a default
    return '/assets/salon-card.png';
  }
  
  // Map service names to our specific uploaded images as a last resort fallback
  if (url.toLowerCase().includes('french') || url.toLowerCase().includes('tips')) {
    return '/assets/french-tips.png';
  } else if (url.toLowerCase().includes('gel') || url.toLowerCase().includes('manicure') || url.toLowerCase().includes('lux')) {
    return '/assets/gel-manicure.png';
  } else if (url.toLowerCase().includes('acrylic') || url.toLowerCase().includes('sculpt')) {
    return '/assets/sculpted-acrylics.png';
  } else if (url.toLowerCase().includes('custom') || url.toLowerCase().includes('design') || url.toLowerCase().includes('glam')) {
    return '/assets/glam-design.png';
  }
  
  // Default fallback to french tips image
  return '/assets/french-tips.png';
}
