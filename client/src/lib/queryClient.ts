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
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
