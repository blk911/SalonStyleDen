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
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get visualization files' 
      });
    }
  });
  
  // Generate a new visualization
  app.post('/api/madge/generate', async (req: Request, res: Response) => {
    try {
      const { layout = 'dot', format = 'svg', focus, depth = 15 } = req.body;
      
      // Validate layout option
      const validLayouts = ['dot', 'fdp', 'twopi', 'circo'];
      if (!validLayouts.includes(layout)) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ 
          success: false,
          error: 'Invalid layout option' 
        });
      }
      
      // Validate format option
      const validFormats = ['svg', 'png'];
      if (!validFormats.includes(format)) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ 
          success: false,
          error: 'Invalid format option' 
        });
      }
      
      // Generate a unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const focusPath = focus ? focus.replace(/^\.\//, '').replace(/\//g, '-') : 'full';
      const filename = `vmb-network-${layout}-${focusPath}-${timestamp}.${format}`;
      const outputPath = path.join(visualizationsDir, filename);
      
      // Build command for generating the visualization
      let command = `node ./node_modules/.bin/madge`;
      
      // Add options
      command += ` --exclude="node_modules|dist"`;
      command += ` --image="${outputPath}"`;
      command += ` --layout="${layout}"`;
      
      // Add focus path if provided, otherwise analyze the entire project
      const sourcePath = focus ? `./${focus}` : './client/src';
      command += ` ${sourcePath}`;
      
      console.log(`Executing Madge command: ${command}`);
      
      // Execute the command
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('Warning')) {
        console.error('Error generating visualization:', stderr);
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({ 
          success: false,
          error: 'Failed to generate visualization', 
          details: stderr 
        });
      }
      
      // Check if the file was created
      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        const fileSizeInKB = Math.round(stats.size / 1024);
        
        res.setHeader('Content-Type', 'application/json');
        res.json({
          success: true,
          filename,
          path: `/visualizations/${filename}`,
          size: fileSizeInKB,
          layout,
          format,
          output: stdout
        });
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ 
          success: false,
          error: 'Visualization file was not created',
          command,
          output: stdout
        });
      }
    } catch (error) {
      console.error('Error generating visualization:', error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ 
        success: false,
        error: 'Failed to generate visualization',
        message: error instanceof Error ? error.message : String(error)
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