import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit & { data?: unknown }
): Promise<T> {
  try {
    console.log(`Making API request to ${url}`, options?.method || 'GET');
    
    // Create a new object for fetch options
    const fetchOptions: RequestInit = {
      method: options?.method || 'GET',
      credentials: "include" as RequestCredentials,
    };
    
    // Handle headers
    if (options?.data && !options.body) {
      fetchOptions.headers = { "Content-Type": "application/json" };
      fetchOptions.body = JSON.stringify(options.data);
    } else if (options?.body) {
      fetchOptions.body = options.body;
      // Add Content-Type header for JSON if not present
      if (!fetchOptions.headers && typeof options.body === 'string' && options.body.startsWith('{')) {
        fetchOptions.headers = { "Content-Type": "application/json" };
      }
    }
    
    // Copy remaining properties from options
    if (options) {
      for (const key in options) {
        if (key !== 'data' && key !== 'body' && key !== 'method' && key !== 'credentials') {
          (fetchOptions as any)[key] = (options as any)[key];
        }
      }
    }
    
    console.log(`API request options:`, fetchOptions);
    const res = await fetch(url, fetchOptions);
    console.log(`API response status:`, res.status);
    
    // Special case for promo code validation
    if (url.includes('/api/invitations/validate')) {
      try {
        const responseData = await res.json();
        console.log('Validation response:', responseData);
        return responseData as T;
      } catch (parseError) {
        console.error('Error parsing validation response:', parseError);
        throw new Error('Failed to parse validation response');
      }
    }
    
    await throwIfResNotOk(res);
    
    try {
      // Check if response is JSON before trying to parse it
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        console.log(`API response data:`, data);
        return data;
      } else {
        // Handle non-JSON responses
        const text = await res.text();
        console.log(`API response text:`, text);
        
        // If it looks like JSON but wasn't marked as such, try to parse it
        if (text.startsWith('{') || text.startsWith('[')) {
          try {
            const data = JSON.parse(text);
            console.log(`API response data (parsed from text):`, data);
            return data;
          } catch (parseError) {
            console.error('Error parsing JSON-like text response:', parseError);
            console.error('Raw response text:', text);
            throw new Error(`Failed to parse response: ${text}`);
          }
        }
        
        return { success: true, message: text } as unknown as T;
      }
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      
      // Get response text for debugging
      try {
        const text = await res.text();
        console.error('Raw response text:', text);
        
        // Check if the response is the problematic "[object Object]" string
        if (text.includes('[object Object]')) {
          throw new Error('Server returned [object Object] - likely a JSON serialization error on the server side');
        }
        
        throw new Error(`Failed to parse JSON response: ${text}`);
      } catch (textError) {
        console.error('Error getting response text:', textError);
        throw new Error('Failed to parse response and unable to get response text');
      }
    }
  } catch (error) {
    console.error(`API request error for ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn = <T,>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (options.on401 === "returnNull" && res.status === 401) {
        return null as any;
      }

      await throwIfResNotOk(res);
      
      // Check if response is JSON before trying to parse it
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          return await res.json();
        } catch (jsonError) {
          console.error('Error parsing JSON response in getQueryFn:', jsonError);
          
          // Try to get response text for debugging
          try {
            const text = await res.text();
            console.error('Raw response text:', text);
            
            // Check if the response is the problematic "[object Object]" string
            if (text.includes('[object Object]')) {
              throw new Error('Server returned [object Object] - likely a JSON serialization error on the server side');
            }
            
            throw new Error(`Failed to parse JSON response: ${text}`);
          } catch (textError) {
            console.error('Error getting response text:', textError);
            throw new Error('Failed to parse response and unable to get response text');
          }
        }
      }
      
      // For non-JSON responses, return a simple object
      const defaultResponse = { success: true, message: 'Non-JSON response received' };
      return defaultResponse as any;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Enable refresh when window gets focus
      staleTime: 30000, // Consider data stale after 30 seconds
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
