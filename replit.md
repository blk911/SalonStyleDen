# VMB Platform Documentation

## Project Overview
VMB is a comprehensive salon management platform that enables salons to manage services, clients, invitations, and promotional campaigns. The platform includes both admin and salon-specific dashboards with real-time monitoring capabilities.

## Recent Changes
- Fixed server startup issues - eliminated port conflicts
- Added comprehensive Storybook setup for component documentation
- Created interactive component stories for UI elements and VMB platform components
- Configured Storybook with proper Tailwind CSS and TypeScript support
- Set up component documentation with examples and interactive controls
- Removed unwanted toast notification from carousel component (July 12, 2025)
- Eliminated ThoughtBubble component from ClientsPage that was showing "Ven Me Baby gifting" message
- Cleaned up imports and state management for better code organization

## Project Architecture
### Frontend Structure
- React with TypeScript
- Wouter for routing
- TanStack Query for data fetching
- Shadcn/UI component library
- Tailwind CSS for styling

### Backend Structure
- Express.js server
- PostgreSQL database with Drizzle ORM
- RESTful API endpoints
- Session-based authentication

### Key Components
- AdminDashboard: Main admin interface with multiple collapsible sections
- SalonDashboard: Salon-specific management interface
- Various visualization tools and monitoring systems

## User Preferences
- Documentation and component visualization highly valued
- Prefers comprehensive tooling for development efficiency
- Wants interactive guides and documentation within the platform

## Development Tools
- Storybook for component documentation and testing
- Auto-refresh scripts for server stability
- Dependency visualization tools
- Real-time monitoring and logging systems