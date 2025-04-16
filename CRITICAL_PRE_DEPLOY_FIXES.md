# CRITICAL PRE-DEPLOYMENT FIXES

## High Priority Issues

### 1. Make Client ID Dynamic in VMB STYLE OPTIONS ENGINE

**Location:** `client/src/pages/SalonPublicPage.tsx` (line 379)

**Issue:** Currently using a hardcoded client ID (1) for VMB STYLE OPTIONS ENGINE.

**Impact:** All users will save style selections as the same client, causing data corruption.

**Required Fix:** Replace the hardcoded client ID with the actual logged-in user's client ID from the authentication context. 

Example solution:
```jsx
clientId={currentUser?.clientId} // Get from auth context instead of hardcoded 1
```

**Implementation Notes:**
- This change must be made before deployment to production
- Will require implementing or extending the authentication system to track the current client ID
- May need to adjust component to handle cases where no client is logged in

### 2. Replace Hardcoded IDs in Sitemap and Navigation

**Locations:** 
- `client/src/pages/Sitemap.tsx` (lines 29-30, 49-50)

**Issue:** The sitemap and several navigation links use hardcoded IDs (1) for both salon and client routes.

**Impact:** Navigation will always lead to the same salon/client regardless of the user, creating a poor user experience and potential security issues.

**Required Fix:** Implement proper dynamic navigation based on the logged-in user's context.

Example solution for client dashboard:
```jsx
// Get user context
const { currentUser } = useAuth();

// In navigation component
<Link href={`/client/${currentUser?.clientId}`}>Client Dashboard</Link>
```

### 3. Implement Client ID Validation in Style Selection API Endpoint

**Location:** `server/routes.ts` (Client style selection endpoint)

**Issue:** The API endpoint for style selections does not validate whether the requesting user is authorized to make selections for the specified client ID.

**Impact:** Any user could potentially make style selections for any client, creating security vulnerabilities.

**Required Fix:** Add authentication and authorization checks to the style selection endpoint.

Example solution:
```js
// In API route
if (Number(clientId) !== req.user.clientId) {
  return res.status(403).json({ error: "Unauthorized to make selections for this client" });
}
```

## Additional Known Issues

- Test client with ID 1 was manually added to the database for development purposes.

## Deployment Checklist

- [ ] Replace hardcoded client ID in VMB STYLE OPTIONS ENGINE with dynamic user ID
- [ ] Update navigation links to use dynamic IDs based on user context
- [ ] Implement proper authentication and authorization in all API endpoints
- [ ] Test style selection flow with multiple user accounts
- [ ] Verify data integrity by checking that style selections are properly associated with the correct clients
- [ ] Ensure proper error handling when no user is logged in
- [ ] Remove any test/development data from production database