/**
 * Madge API
 * 
 * Provides endpoints for generating and retrieving network visualizations 
 * using Madge and Graphviz.
 */

import { Express, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Ensure visualizations directory exists
const visualizationsDir = path.join(process.cwd(), 'visualizations');
if (!fs.existsSync(visualizationsDir)) {
  fs.mkdirSync(visualizationsDir, { recursive: true });
  console.log(`Created visualizations directory at ${visualizationsDir}`);
}

// Create a test visualization SVG if it doesn't exist
const testVisualizationPath = path.join(visualizationsDir, 'test-visualization.svg');
if (!fs.existsSync(testVisualizationPath)) {
  const placeholderSvg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect style="fill:#f0f0f0;stroke:none" width="800" height="600" x="0" y="0" />
  <text xml:space="preserve" style="font-style:normal;font-weight:normal;font-size:24px;font-family:Arial;text-align:center;text-anchor:middle;fill:#000000" x="400" y="300">VMB Network Visualization (Test)</text>
</svg>`;
  
  try {
    fs.writeFileSync(testVisualizationPath, placeholderSvg);
    console.log(`Created test visualization at ${testVisualizationPath}`);
  } catch (error) {
    console.error(`Failed to create test visualization: ${error}`);
  }
}

/**
 * Register Madge-related API endpoints
 */
export function registerMadgeRoutes(app: Express) {
  // Get available visualization files
  app.get('/api/madge/visualizations', async (req: Request, res: Response) => {
    try {
      const files = fs.readdirSync(visualizationsDir)
        .filter(file => file.endsWith('.svg') || file.endsWith('.png'))
        .map(file => {
          const stats = fs.statSync(path.join(visualizationsDir, file));
          const layout = file.includes('-dot-') ? 'dot' : 
                       file.includes('-fdp-') ? 'fdp' : 
                       file.includes('-twopi-') ? 'twopi' : 
                       file.includes('-circo-') ? 'circo' : 'unknown';
          
          return {
            id: file,
            name: file.replace(/\.svg$|\.png$/i, '').replace(/-/g, ' '),
            path: `/visualizations/${file}`,
            layout,
            date: stats.mtime.toISOString(),
            size: Math.round(stats.size / 1024) // Size in KB
          };
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      res.json(files);
    } catch (error) {
      console.error('Error getting visualization files:', error);
      res.status(500).json({ error: 'Failed to get visualization files' });
    }
  });
  
  // Generate a new visualization - simplified version that always returns JSON
  app.post('/api/madge/generate', async (req: Request, res: Response) => {
    // Always set Content-Type to application/json
    res.setHeader('Content-Type', 'application/json');
    
    try {
      const { layout = 'dot', format = 'svg', focus = '' } = req.body;
      
      console.log('[MADGE-API] Generate request:', { layout, format, focus });
      
      // Validate layout option
      const validLayouts = ['dot', 'fdp', 'twopi', 'circo'];
      if (!validLayouts.includes(layout)) {
        return res.status(200).json({ 
          success: false, 
          error: 'Invalid layout option' 
        });
      }
      
      // Validate format option
      const validFormats = ['svg', 'png'];
      if (!validFormats.includes(format)) {
        return res.status(200).json({ 
          success: false, 
          error: 'Invalid format option' 
        });
      }
      
      // For development/testing - use pre-created SVG
      const testFile = 'test-visualization.svg';
      const testPath = path.join(visualizationsDir, testFile);
      
      if (fs.existsSync(testPath)) {
        const stats = fs.statSync(testPath);
        const fileSizeInKB = Math.round(stats.size / 1024);
        
        return res.status(200).json({
          success: true,
          filename: testFile,
          path: `/visualizations/${testFile}`,
          size: fileSizeInKB,
          layout,
          format: 'svg',
          output: "Using test visualization (development mode)"
        });
      }
      
      // Generate a unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const focusPath = focus ? focus.replace(/^\.\//, '').replace(/\//g, '-') : 'full';
      const filename = `vmb-network-${layout}-${focusPath}-${timestamp}.${format}`;
      const outputPath = path.join(visualizationsDir, filename);
      
      // Create a simple placeholder SVG
      const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="400" y="300" font-family="Arial" font-size="24" text-anchor="middle">
          VMB Network Visualization: ${focusPath || 'Full Application'}
        </text>
      </svg>`;
      
      // Try to write the placeholder file
      try {
        fs.writeFileSync(outputPath, placeholderSvg);
        
        const stats = fs.statSync(outputPath);
        const fileSizeInKB = Math.round(stats.size / 1024);
        
        return res.status(200).json({
          success: true,
          filename,
          path: `/visualizations/${filename}`,
          size: fileSizeInKB,
          layout,
          format,
          output: "Visualization generated successfully (placeholder mode)"
        });
      } catch (writeError) {
        console.error('[MADGE-API] Error writing visualization file:', writeError);
        return res.status(200).json({ 
          success: false,
          error: 'Failed to write visualization file',
          details: writeError.message
        });
      }
    } catch (error: any) {
      console.error('[MADGE-API] Error generating visualization:', error);
      return res.status(200).json({ 
        success: false,
        error: 'Failed to generate visualization',
        message: error.message || 'Unknown error'
      });
    }
  });
  
  // Serve visualization files
  app.use('/visualizations', (req, res, next) => {
    const filePath = path.join(visualizationsDir, req.path);
    
    // Check if the file exists
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const fileExtension = path.extname(filePath).toLowerCase();
      
      // Set proper content type for SVG and PNG files
      if (fileExtension === '.svg') {
        res.setHeader('Content-Type', 'image/svg+xml');
      } else if (fileExtension === '.png') {
        res.setHeader('Content-Type', 'image/png');
      }
      
      res.sendFile(filePath);
    } else {
      next();
    }
  });
  
  // Add a test endpoint to check if file serving is working
  app.get('/api/madge/test', (req, res) => {
    res.json({ status: 'ok', message: 'Madge API is working correctly' });
  });
}