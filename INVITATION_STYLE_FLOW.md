# VMB STYLE OPTIONS ENGINE & Client Invitation Flow

This document explains the flow between client invitations and the VMB STYLE OPTIONS ENGINE, along with tools to track and test the process.

## Overview

The invitation and style selection process follows these steps:

1. Salon sends an invitation to a client (creates invitation record)
2. Client is created in the system (either via registration or direct creation)
3. Client selects a style using the VMB STYLE OPTIONS ENGINE
4. The style selection is recorded, linking the client, style, and salon
5. (Optional) The invitation status may be updated to reflect the style selection

## Tracking Tools

We've created several scripts to help track and debug this flow:

### 1. Basic Tracking Script (`track-invitation-flow.sh`)

This script monitors API requests related to invitations and style selections, capturing the data flow in real-time.

```bash
./track-invitation-flow.sh
```

### 2. Event Watcher (`watch-invitation-events.sh`)

This script focuses on monitoring server logs for specific events related to invitations and style selections.

```bash
./watch-invitation-events.sh
```

### 3. Automated Flow Test (`test-invitation-style-flow.sh`)

This comprehensive test script simulates the entire flow, from creating an invitation to making a style selection, and verifies each step is working correctly.

```bash
./test-invitation-style-flow.sh
```

## Critical Components

The following components are essential to the invitation-style selection flow:

1. **Invitation API Endpoints**:
   - `POST /api/invitations` - Create a new invitation
   - `GET /api/invitations/:id` - Get a specific invitation
   - `GET /api/salons/:id/invitations` - Get all invitations for a salon

2. **Client API Endpoints**:
   - `POST /api/clients` - Create a new client
   - `GET /api/clients/:id` - Get a specific client

3. **Style Selection API Endpoints**:
   - `POST /api/clients/:clientId/style-selections` - Create a style selection
   - `GET /api/clients/:clientId/style-selections` - Get all style selections for a client

4. **Front-end Components**:
   - `VmbStyleOptions` - The component that displays and handles style selection
   - `SalonPublicPage` - Public page that includes the style options component

## Important Notes

- The current implementation uses a hardcoded `clientId={1}` in the `SalonPublicPage` component for testing purposes.
- This must be replaced with a dynamic client ID from the authentication context before deployment.
- See `CRITICAL_PRE_DEPLOY_FIXES.md` for details on required changes before production deployment.

## Test Salon & Client IDs

For testing purposes, use these IDs:

- **Salon ID 1**: TIFFANY_5280 NAILS STUDIO (main test salon)
- **Client ID 1**: Test Client (specially created for testing style selections)

## Common Issues

If style selections are failing, check:

1. The client with the specified ID exists in the database
2. The salon with the specified ID exists in the database
3. The style ID is valid
4. Console logs for specific error messages