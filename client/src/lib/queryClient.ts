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
  }
  
  // Copy remaining properties from options
  if (options) {
    for (const key in options) {
      if (key !== 'data' && key !== 'body' && key !== 'method' && key !== 'credentials') {
        (fetchOptions as any)[key] = (options as any)[key];
      }
    }
  }
  
  const res = await fetch(url, fetchOptions);

  await throwIfResNotOk(res);
  return await res.json();
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
        return await res.json();
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
