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
  
  console.log('Processing image URL:', url);

  // If it's a data URL, return as is (should never happen in production)
  if (url.startsWith('data:')) {
    console.log('Data URL encountered:', url.substring(0, 30) + '...');
    return url;
  }

  // Check for the most common issue: url is only the filename without the path
  if (!url.includes('/') && !url.includes('\\') && !url.startsWith('http')) {
    console.log('Adding proper path to uploaded file:', url);
    return `/uploads/${url}`;
  }

  // If it's a proper URL from our uploads directory or assets, return as is
  if (url.startsWith('/uploads/') || url.startsWith('/assets/')) {
    return url;
  }
  
  // If the URL is missing the leading slash but has uploads/ or assets/
  if (url.startsWith('uploads/') || url.startsWith('assets/')) {
    return `/${url}`;
  }

  // Handle external URLs for owner photos - these should be returned as-is
  if (url.startsWith('http')) {
    console.log('External URL used directly:', url);
    return url;
  }

  // Handle service images based on filename patterns
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

  // Check for owner photo uploads again (this is likely the case)
  if (url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg') || url.includes('.gif')) {
    console.log('Adding uploads path to image file:', url);
    // Strip any partial paths and just use the filename
    const filename = url.split(/[\/\\]/).pop() || url;
    return `/uploads/${filename}`;
  }

  // Default fallback to VMB logo
  console.log('Using default image for:', url);
  return '/assets/VMB_LOGO.png';
}