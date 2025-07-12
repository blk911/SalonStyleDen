/**
 * VMB Network Visualization Helper
 * 
 * This module provides utility functions for fetching and displaying
 * dependency visualization data in the application.
 */

import { apiRequest } from './apiRequest';

export interface VisualizerNode {
  id: string;
  group: number;
  level: number;
  type: 'component' | 'page' | 'hook' | 'context' | 'util' | 'api';
  dependencies: string[];
}

export interface VisualizerLink {
  source: string;
  target: string;
  value: number;
  type: 'import' | 'context' | 'props' | 'custom';
}

export interface VisualizerData {
  nodes: VisualizerNode[];
  links: VisualizerLink[];
  timestamp: string;
}

/**
 * Fetch network visualization data from the server
 */
export async function fetchNetworkData(options?: {
  focus?: string;
  depth?: number;
  includeNpm?: boolean;
}): Promise<VisualizerData> {
  try {
    const queryParams = new URLSearchParams();
    if (options?.focus) queryParams.append('focus', options.focus);
    if (options?.depth) queryParams.append('depth', options.depth.toString());
    if (options?.includeNpm !== undefined) queryParams.append('includeNpm', options.includeNpm.toString());
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetch(`/api/visualization/network${queryString}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch network data: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching network visualization data:', error);
    // Return empty visualization data as fallback
    return {
      nodes: [],
      links: [],
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Generate a network visualization image
 */
export async function generateNetworkImage(options?: {
  layout?: 'dot' | 'fdp' | 'twopi' | 'circo';
  format?: 'svg' | 'png';
  focus?: string;
  depth?: number;
}): Promise<string> {
  try {
    const response = await apiRequest('/api/visualization/generate', 'POST', options || {});
    
    if (!response.ok) {
      throw new Error(`Failed to generate network image: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error('Error generating network visualization:', error);
    throw error;
  }
}

/**
 * Get component type based on file path
 */
export function getComponentType(path: string): VisualizerNode['type'] {
  if (path.includes('/components/')) return 'component';
  if (path.includes('/pages/')) return 'page';
  if (path.includes('/hooks/')) return 'hook';
  if (path.includes('/contexts/')) return 'context';
  if (path.includes('/utils/') || path.includes('/lib/')) return 'util';
  if (path.includes('/api/')) return 'api';
  return 'util';
}

/**
 * Format node label for display
 */
export function formatNodeLabel(id: string): string {
  // Extract filename without extension
  const parts = id.split('/');
  const filename = parts[parts.length - 1].split('.')[0];
  
  // For indexes, use the parent directory name
  if (filename === 'index') {
    return parts[parts.length - 2];
  }
  
  return filename;
}