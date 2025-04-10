import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
  
  // If it's a data URL or already a complete URL, return as is
  if (url.startsWith('data:') || url.startsWith('http')) {
    return url;
  }
  
  // Handle Windows paths (convert to web URLs)
  if (url.includes(':\\') || url.includes('C:')) {
    console.log('Converting Windows path:', url);
    // Extract just the filename from the Windows path
    const filename = url.split('\\').pop()?.toLowerCase() || '';
    
    if (filename.includes('french') || filename.includes('tips')) {
      return '/assets/french-tips.png';
    } else if (filename.includes('gel') || filename.includes('manicure')) {
      return '/assets/gel-manicure.png';
    } else if (filename.includes('acrylic') || filename.includes('sculpt')) {
      return '/assets/french-tips.png';
    } else if (filename.includes('custom') || filename.includes('design') || filename.includes('glam')) {
      return '/assets/gel-manicure.png';
    }
    
    // If we can't match the filename, use a default
    return '/assets/salon-card.png';
  }
  
  // Map service names to our specific uploaded images
  if (url.toLowerCase().includes('french') || url.toLowerCase().includes('tips')) {
    return '/assets/french-tips.png';
  } else if (url.toLowerCase().includes('gel') || url.toLowerCase().includes('manicure') || url.toLowerCase().includes('lux')) {
    return '/assets/gel-manicure.png';
  } else if (url.toLowerCase().includes('acrylic') || url.toLowerCase().includes('sculpt')) {
    return '/assets/french-tips.png';
  } else if (url.toLowerCase().includes('custom') || url.toLowerCase().includes('design') || url.toLowerCase().includes('glam')) {
    return '/assets/gel-manicure.png';
  }
  
  // Default fallback to one of our salon images
  return '/assets/salon-card.png';
}
