# VMB Platform Documentation

## Project Overview
VMB is a comprehensive salon management platform that enables salons to manage services, clients, invitations, and promotional campaigns. The platform includes both admin and salon-specific dashboards with real-time monitoring capabilities.

## Recent Changes
- RESOLVED: Dual server startup issue - eliminated duplicate server instances (July 14, 2025)
- Fixed race condition in server startup logic causing two servers to start simultaneously
- Implemented single instance protection with serverStarted flag
- Removed redundant server startup scripts (server_refresh_script.js, port-backup.js)
- Disabled automatic logging initialization messages that were creating duplicate logs
- Server now starts cleanly with single instance on available port (5000 or 5001)
- RESOLVED: Server restart requirement after modifications (July 14, 2025)
- Fixed critical port management and server startup architecture
- Installed kill-port package for reliable port cleanup before server startup
- Implemented robust port management with guaranteed port 5000 startup
- Eliminated recursive port conflicts that caused infinite restart loops
- Server now starts reliably without requiring manual resets after code changes
- Fixed MaxListenersExceededWarning and port conflicts (July 14, 2025)
- Fixed form label display issues in ClientRegistrationPage (July 14, 2025)
- Changed "REGISTRATION" to "Registration" in CardTitle for better consistency
- Fixed FormLabel components showing "F" and "P" to display "Full Name" and "Phone Number"
- Resolved ELEM Editor issues where abbreviated labels were persisting after edits
- Updated client type selector text from "New Client" to "CLIENT" for cleaner UI (July 14, 2025)
- Fixed server startup infinite loop issue (July 13, 2025)
- Resolved port conflict management causing recursive retry failures
- Improved port cleanup logic using netstat instead of lsof for better compatibility
- Eliminated problematic automatic port monitoring that was causing deadlocks
- Server now starts cleanly with proper error handling and timeout management
- Fixed JSON parsing errors across client and server (July 13, 2025)
- Enhanced error handling for [object Object] parsing issues
- Improved port management with automatic conflict resolution
- Added comprehensive JSON response validation in API client
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