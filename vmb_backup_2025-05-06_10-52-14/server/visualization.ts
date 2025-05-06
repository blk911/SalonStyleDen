import { db } from './db';
import { Express, Request, Response } from 'express';
import { 
  clients, 
  salons, 
  invitations, 
  styleSelections, 
  activityLogs 
} from '../shared/schema';

/**
 * Registers visualization-related endpoints for network diagrams
 */
export function registerVisualizationRoutes(app: Express) {
  // Get component relationships information
  app.get('/api/components', async (req: Request, res: Response) => {
    try {
      interface ComponentNode {
        id: string;
        name: string;
        group: string;
        size: number;
        type: string;
      }
      
      interface ComponentLink {
        source: string;
        target: string;
        value: number;
        type: string;
      }
      
      // Define the main components and their relationships
      const nodes: ComponentNode[] = [
        // Main Pages
        { id: 'home', name: 'Home Page', group: 'page', size: 100, type: 'page' },
        { id: 'client-dash', name: 'Client Dashboard', group: 'page', size: 100, type: 'page' },
        { id: 'salon-dash', name: 'Salon Dashboard', group: 'page', size: 100, type: 'page' },
        { id: 'admin-dash', name: 'Admin Dashboard', group: 'page', size: 100, type: 'page' },
        { id: 'salon-public', name: 'Salon Public Page', group: 'page', size: 100, type: 'page' },
        { id: 'network-viz', name: 'Network Visualization', group: 'page', size: 100, type: 'page' },
        
        // Components
        { id: 'navbar', name: 'Navigation Bar', group: 'component', size: 70, type: 'layout' },
        { id: 'footer', name: 'Footer', group: 'component', size: 60, type: 'layout' },
        { id: 'brand-name', name: 'BrandName', group: 'component', size: 40, type: 'ui' },
        
        // Forms
        { id: 'client-form', name: 'Client Registration Form', group: 'form', size: 80, type: 'form' },
        { id: 'salon-form', name: 'Salon Registration Form', group: 'form', size: 80, type: 'form' },
        { id: 'service-form', name: 'Service Management Form', group: 'form', size: 70, type: 'form' },
        { id: 'invitation-form', name: 'Client Invitation Form', group: 'form', size: 70, type: 'form' },
        
        // Dialogs
        { id: 'contact-dialog', name: 'Contact Validation Dialog', group: 'dialog', size: 65, type: 'dialog' },
        { id: 'confirmation-dialog', name: 'Confirmation Dialog', group: 'dialog', size: 60, type: 'dialog' },
        { id: 'service-dialog', name: 'Service Selection Dialog', group: 'dialog', size: 65, type: 'dialog' },
        { id: 'sponsor-dialog', name: 'Sponsor Selection Dialog', group: 'dialog', size: 65, type: 'dialog' },
        
        // Cards
        { id: 'service-card', name: 'Service Card', group: 'card', size: 50, type: 'display' },
        { id: 'promotion-card', name: 'Promotion Card', group: 'card', size: 50, type: 'display' },
        { id: 'client-card', name: 'Client Card', group: 'card', size: 50, type: 'display' },
        { id: 'invitation-card', name: 'Invitation Card', group: 'card', size: 50, type: 'display' },
        { id: 'stylist-card', name: 'Stylist Card', group: 'card', size: 50, type: 'display' },
        { id: 'salon-card', name: 'Salon Card', group: 'card', size: 50, type: 'display' },
        
        // Functional Components
        { id: 'style-engine', name: 'VMB Style Options Engine', group: 'engine', size: 90, type: 'functional' },
        { id: 'promo-engine', name: 'Client Promo Engine', group: 'engine', size: 90, type: 'functional' },
        { id: 'schedule-widget', name: 'Schedule Widget', group: 'widget', size: 70, type: 'functional' },
        { id: 'map-widget', name: 'Location Map Widget', group: 'widget', size: 60, type: 'functional' },
      ];
      
      // Define component relationships (source → target)
      const links: ComponentLink[] = [
        // Navbar connections to pages
        { source: 'navbar', target: 'home', value: 3, type: 'contains' },
        { source: 'navbar', target: 'client-dash', value: 3, type: 'navigates' },
        { source: 'navbar', target: 'salon-dash', value: 3, type: 'navigates' },
        { source: 'navbar', target: 'admin-dash', value: 3, type: 'navigates' },
        { source: 'navbar', target: 'network-viz', value: 3, type: 'navigates' },
        { source: 'navbar', target: 'brand-name', value: 2, type: 'contains' },
        
        // Home page connections
        { source: 'home', target: 'client-form', value: 4, type: 'contains' },
        { source: 'home', target: 'salon-form', value: 4, type: 'contains' },
        { source: 'home', target: 'footer', value: 2, type: 'contains' },
        
        // Client Dashboard
        { source: 'client-dash', target: 'service-card', value: 5, type: 'contains' },
        { source: 'client-dash', target: 'promotion-card', value: 4, type: 'contains' },
        { source: 'client-dash', target: 'stylist-card', value: 3, type: 'contains' },
        { source: 'client-dash', target: 'schedule-widget', value: 4, type: 'uses' },
        
        // Salon Dashboard
        { source: 'salon-dash', target: 'service-form', value: 5, type: 'contains' },
        { source: 'salon-dash', target: 'client-card', value: 4, type: 'contains' },
        { source: 'salon-dash', target: 'invitation-form', value: 5, type: 'contains' },
        { source: 'salon-dash', target: 'invitation-card', value: 4, type: 'contains' },
        { source: 'salon-dash', target: 'schedule-widget', value: 3, type: 'uses' },
        { source: 'salon-dash', target: 'map-widget', value: 2, type: 'uses' },
        
        // Public Salon Page
        { source: 'salon-public', target: 'service-card', value: 5, type: 'contains' },
        { source: 'salon-public', target: 'promotion-card', value: 4, type: 'contains' },
        { source: 'salon-public', target: 'stylist-card', value: 3, type: 'contains' },
        { source: 'salon-public', target: 'map-widget', value: 3, type: 'uses' },
        { source: 'salon-public', target: 'footer', value: 2, type: 'contains' },
        
        // Admin Dashboard
        { source: 'admin-dash', target: 'salon-card', value: 4, type: 'contains' },
        { source: 'admin-dash', target: 'client-card', value: 4, type: 'contains' },
        
        // Dialog connections
        { source: 'client-form', target: 'contact-dialog', value: 3, type: 'opens' },
        { source: 'client-form', target: 'sponsor-dialog', value: 3, type: 'opens' },
        { source: 'salon-form', target: 'contact-dialog', value: 3, type: 'opens' },
        { source: 'invitation-form', target: 'confirmation-dialog', value: 3, type: 'opens' },
        { source: 'service-form', target: 'service-dialog', value: 4, type: 'opens' },
        
        // Engine connections
        { source: 'style-engine', target: 'service-card', value: 5, type: 'powers' },
        { source: 'style-engine', target: 'service-dialog', value: 4, type: 'powers' },
        { source: 'promo-engine', target: 'promotion-card', value: 5, type: 'powers' },
        
        // Component reuse
        { source: 'brand-name', target: 'footer', value: 2, type: 'used-in' },
        { source: 'footer', target: 'salon-public', value: 2, type: 'used-in' },
      ];
      
      // Return the component relationship data
      return res.status(200).json({ nodes, links });
    } catch (error) {
      console.error('Error generating component information:', error);
      return res.status(500).json({ 
        error: 'Failed to generate component information',
        message: (error as Error).message
      });
    }
  });
  
  // Get database schema information
  app.get('/api/schema', async (req: Request, res: Response) => {
    try {
      // Define more specific types for the schema information
      interface ColumnInfo {
        name: string;
        type: string;
      }
      
      interface TableInfo {
        name: string;
        columns: Record<string, ColumnInfo>;
        relations?: Record<string, { references: string }>;
      }
      
      // Extract schema information from the shared schema
      const schemaInfo: { tables: Record<string, TableInfo> } = {
        tables: {}
      };
      
      // List of tables we know exist in the schema
      const tables: Array<{ name: string; schema: any }> = [
        { name: 'clients', schema: clients },
        { name: 'salons', schema: salons },
        { name: 'invitations', schema: invitations },
        { name: 'style_selections', schema: styleSelections },
        { name: 'activity_logs', schema: activityLogs }
      ];
      
      // Check if services table exists in shared schema
      try {
        const { services } = require('../shared/schema');
        if (services) {
          tables.push({ name: 'services', schema: services });
        }
      } catch (e) {
        console.log('Services table not found in schema, will use placeholder');
      }
      
      // Add each table to the schema info
      tables.forEach(table => {
        const columns: Record<string, ColumnInfo> = {};
        
        // Extract column information if available
        if (table.schema) {
          // Drizzle tables have a _.columns property that contains column objects
          const tableObj = table.schema as any;
          if (tableObj._ && tableObj._.columns) {
            for (const [key, column] of Object.entries(tableObj._.columns)) {
              columns[key] = {
                name: key,
                type: (column as any).dataType?.name || 'unknown'
              };
            }
          }
        }
        
        // Create the table entry with properly typed columns
        schemaInfo.tables[table.name] = {
          name: table.name,
          columns: columns
        };
      });
      
      // Add known relations
      if (schemaInfo.tables['clients']) {
        schemaInfo.tables['clients'].relations = {
          salon: { references: 'salons' }
        };
      }
      
      if (schemaInfo.tables['services']) {
        schemaInfo.tables['services'].relations = {
          salon: { references: 'salons' }
        };
      }
      
      if (schemaInfo.tables['invitations']) {
        schemaInfo.tables['invitations'].relations = {
          salon: { references: 'salons' },
          client: { references: 'clients' }
        };
      }
      
      if (schemaInfo.tables['style_selections']) {
        schemaInfo.tables['style_selections'].relations = {
          client: { references: 'clients' },
          service: { references: 'services' }
        };
      }
      
      return res.status(200).json(schemaInfo);
    } catch (error) {
      console.error('Error generating schema information:', error);
      return res.status(500).json({ 
        error: 'Failed to generate schema information',
        message: (error as Error).message
      });
    }
  });
  
  // Get API endpoint information
  app.get('/api/endpoints', async (req: Request, res: Response) => {
    try {
      // Define interfaces for network visualization
      interface NetworkNode {
        name: string;
        id: string;
        group: string;
        size: number;
        type: string;
        value: number;
      }
      
      interface NetworkLink {
        source: string;
        target: string;
        value: number;
        type: string;
      }
      
      // Nodes and links for the network visualization
      const nodes: NetworkNode[] = [];
      const links: NetworkLink[] = [];
      
      // API endpoints
      const endpoints = [
        { path: '/api/health', method: 'GET', connects: [] },
        { path: '/api/status', method: 'GET', connects: [] },
        { path: '/api/schema', method: 'GET', connects: [] },
        { path: '/api/endpoints', method: 'GET', connects: [] },
        { path: '/api/salons', method: 'GET', connects: ['salons'] },
        { path: '/api/salons', method: 'POST', connects: ['salons'] },
        { path: '/api/salons/:id', method: 'GET', connects: ['salons'] },
        { path: '/api/salons/:id', method: 'PUT', connects: ['salons'] },
        { path: '/api/salons/:id', method: 'PATCH', connects: ['salons'] },
        { path: '/api/salons/:id/services', method: 'POST', connects: ['salons', 'services'] },
        { path: '/api/salons/:id/promos', method: 'POST', connects: ['salons'] },
        { path: '/api/salons/:id/schedule', method: 'POST', connects: ['salons'] },
        { path: '/api/clients', method: 'GET', connects: ['clients'] },
        { path: '/api/clients', method: 'POST', connects: ['clients'] },
        { path: '/api/clients/:id', method: 'GET', connects: ['clients'] },
        { path: '/api/clients/:id', method: 'PUT', connects: ['clients'] },
        { path: '/api/invitations', method: 'POST', connects: ['invitations', 'clients', 'salons'] },
        { path: '/api/invitations', method: 'GET', connects: ['invitations'] },
        { path: '/api/invitations/:id', method: 'GET', connects: ['invitations'] },
        { path: '/api/invitations/validate', method: 'POST', connects: ['invitations'] },
        { path: '/api/salons/:id/invitations', method: 'GET', connects: ['salons', 'invitations'] },
        { path: '/api/clients/:clientId/style-selections', method: 'POST', connects: ['clients', 'style_selections'] },
        { path: '/api/clients/:clientId/style-selections', method: 'GET', connects: ['clients', 'style_selections'] },
        { path: '/api/salons/:salonId/style-selections', method: 'GET', connects: ['salons', 'style_selections'] },
        { path: '/api/activity-logs', method: 'POST', connects: ['activity_logs'] },
        { path: '/api/activity-logs', method: 'GET', connects: ['activity_logs'] },
        { path: '/api/upload', method: 'POST', connects: [] },
        { path: '/api/vmb-invitations/log', method: 'POST', connects: ['activity_logs'] }
      ];
      
      // Frontend page routes
      const frontendRoutes = [
        { path: '/', name: 'Home' },
        { path: '/clients', name: 'Clients' },
        { path: '/client/:id', name: 'ClientDashboard' },
        { path: '/salons', name: 'Salons' },
        { path: '/salon/:id', name: 'SalonDashboard' },
        { path: '/admin', name: 'AdminDashboard' },
        { path: '/salon/:id/public', name: 'SalonPublicPage' },
        { path: '/network-visualization', name: 'NetworkVisualization' }
      ];
      
      // Add tables as nodes
      const tables = [
        'clients', 'salons', 'services', 'invitations', 'style_selections', 'activity_logs'
      ];
      
      tables.forEach(table => {
        nodes.push({
          name: table,
          id: table,
          group: 'table',
          size: 300,
          type: 'database',
          value: 10
        });
      });
      
      // Add API endpoints as nodes
      endpoints.forEach(endpoint => {
        const id = `${endpoint.method}-${endpoint.path}`;
        nodes.push({
          name: `${endpoint.method} ${endpoint.path}`,
          id,
          group: 'endpoint',
          size: 200,
          type: 'endpoint',
          value: 5
        });
        
        // Connect endpoints to database tables they use
        endpoint.connects.forEach(table => {
          links.push({
            source: id,
            target: table,
            value: 2,
            type: 'uses'
          });
        });
      });
      
      // Add frontend routes as nodes
      frontendRoutes.forEach(route => {
        const id = `route-${route.path}`;
        nodes.push({
          name: route.name,
          id,
          group: 'page',
          size: 150,
          type: 'component',
          value: 5
        });
        
        // Connect pages to relevant API endpoints
        if (route.path === '/clients' || route.path === '/client/:id') {
          links.push({
            source: id,
            target: 'GET-/api/clients',
            value: 1,
            type: 'calls'
          });
        } else if (route.path === '/salons' || route.path === '/salon/:id') {
          links.push({
            source: id,
            target: 'GET-/api/salons',
            value: 1,
            type: 'calls'
          });
        } else if (route.path === '/salon/:id/public') {
          links.push({
            source: id,
            target: 'GET-/api/salons/:id',
            value: 1,
            type: 'calls'
          });
          links.push({
            source: id,
            target: 'GET-/api/salons/:id/services',
            value: 1,
            type: 'calls'
          });
        }
      });
      
      return res.status(200).json({ nodes, links });
    } catch (error) {
      console.error('Error generating endpoint information:', error);
      return res.status(500).json({ 
        error: 'Failed to generate endpoint information',
        message: (error as Error).message
      });
    }
  });
}