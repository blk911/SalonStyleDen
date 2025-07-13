/**
 * Utility function for making API requests
 */

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function apiRequest(
  url: string, 
  method: HttpMethod = 'GET', 
  data?: any, 
  headers: HeadersInit = {}
): Promise<Response> {
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers
  };
  
  const options: RequestInit = {
    method,
    headers: defaultHeaders,
    credentials: 'same-origin'
  };
  
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }
  
  // Ensure URL has leading slash and is relative to root
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  
  try {
    // Log the request for debugging (in development only)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`API ${method} ${normalizedUrl}`, data || '');
    }
    
    const response = await fetch(normalizedUrl, options);
    
    // Log failures for debugging
    if (!response.ok && process.env.NODE_ENV !== 'production') {
      console.error(`API Error (${response.status}): ${normalizedUrl}`);
    }
    
    return response;
  } catch (error) {
    console.error(`API Request Error: ${normalizedUrl}`, error);
    throw error;
  }
}