/**
 * Safe JSON Parsing Utilities
 * 
 * This module provides robust JSON parsing functions that prevent the
 * "[object Object] is not valid JSON" error by properly type-checking
 * inputs before attempting to parse them.
 */

export interface ParseResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
}

/**
 * Safely parse JSON input with proper type checking
 * @param input - The input to parse (should be a string)
 * @returns Parsed object or null if parsing fails
 */
export function safeParse<T = any>(input: unknown): T | null {
  try {
    // Only attempt to parse strings
    if (typeof input !== 'string') {
      console.warn('⚠️ safeParse: Input is not a string, returning null', { 
        type: typeof input, 
        value: input 
      });
      return null;
    }
    
    // Handle empty strings
    if (input.trim() === '') {
      console.warn('⚠️ safeParse: Empty string provided');
      return null;
    }
    
    return JSON.parse(input) as T;
  } catch (error) {
    console.error('❌ JSON parse failed:', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      input: typeof input === 'string' ? input.slice(0, 100) + '...' : input
    });
    return null;
  }
}

/**
 * Safely parse JSON with detailed result information
 * @param input - The input to parse
 * @returns ParseResult with success status, data, and error details
 */
export function safeParseWithResult<T = any>(input: unknown): ParseResult<T> {
  try {
    if (typeof input !== 'string') {
      return {
        success: false,
        data: null,
        error: `Expected string, got ${typeof input}`
      };
    }
    
    if (input.trim() === '') {
      return {
        success: false,
        data: null,
        error: 'Empty string provided'
      };
    }
    
    const parsed = JSON.parse(input) as T;
    return {
      success: true,
      data: parsed
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Parse failed'
    };
  }
}

/**
 * Smart JSON handler that returns the input as-is if it's already an object,
 * or attempts to parse it if it's a string
 * @param input - String to parse or object to return as-is
 * @returns Parsed object or original object
 */
export function smartJsonHandler<T = any>(input: unknown): T | null {
  // If it's already an object (and not null), return it as-is
  if (typeof input === 'object' && input !== null) {
    return input as T;
  }
  
  // If it's a string, safely parse it
  if (typeof input === 'string') {
    return safeParse<T>(input);
  }
  
  // For other types, log a warning and return null
  console.warn('⚠️ smartJsonHandler: Unexpected input type', { 
    type: typeof input, 
    value: input 
  });
  return null;
}

/**
 * Legacy JSON.parse replacement with better error messages
 * Use this as a drop-in replacement for JSON.parse where you can't
 * refactor to use safeParse immediately
 */
export function betterJsonParse<T = any>(input: string): T {
  if (typeof input !== 'string') {
    throw new Error(`JSON.parse expects a string, but received ${typeof input}. Value: ${input}`);
  }
  
  try {
    return JSON.parse(input) as T;
  } catch (error) {
    const truncatedInput = input.slice(0, 100);
    throw new Error(`Failed to parse JSON. Input: "${truncatedInput}${input.length > 100 ? '...' : ''}". Error: ${error}`);
  }
}

/**
 * Monkey patch for JSON.parse to prevent the "[object Object]" error
 * WARNING: This is for debugging only, do not use in production
 */
export function enableJsonParseMonkeyPatch() {
  if (process.env.NODE_ENV === 'production') {
    console.warn('JSON.parse monkey patch should not be used in production');
    return;
  }
  
  const originalParse = JSON.parse;
  (JSON as any).parse = (input: any) => {
    if (typeof input !== 'string') {
      console.warn('⚠️ JSON.parse called on non-string:', { 
        type: typeof input, 
        value: input,
        stack: new Error().stack 
      });
      // Return the input as-is instead of crashing
      return input;
    }
    return originalParse(input);
  };
  
  console.log('🐒 JSON.parse monkey patch enabled for debugging');
}