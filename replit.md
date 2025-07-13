# VMB Platform Documentation

## Project Overview
VMB is a comprehensive salon management platform that enables salons to manage services, clients, invitations, and promotional campaigns. The platform includes both admin and salon-specific dashboards with real-time monitoring capabilities.

## Recent Changes
- **CRITICAL:** Fixed recurring "[object Object] is not valid JSON" bug (July 13, 2025)
  - Identified root cause: incorrect use of `safeParse<boolean>()` for localStorage values
  - Fixed all instances in SalonDashboard.tsx, InvitationPage.tsx, and debug-config.ts
  - Replaced JSON parsing with simple string comparison for boolean values
  - Added comprehensive localStorage cleanup script
  - Server now runs stable without JSON parsing crashes
- **Server Stability:** Fixed port conflict restart loop issues
- **Asset Path Corrections:** Fixed missing logo paths by copying to public directory

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