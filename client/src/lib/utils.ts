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
  
  // Fall back to placeholder images if we have URL problems
  if (url.startsWith('/images/')) {
    return `https://picsum.photos/400/300?random=${Date.now()}`;
  }
  
  return url;
}
