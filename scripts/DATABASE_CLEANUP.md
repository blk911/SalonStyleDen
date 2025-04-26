# VMB Database Cleanup

This document outlines the database cleanup process performed to reset the VMB application state while keeping Tiffany's salon data intact.

## What Was Done

On April 26, 2025, we performed a database cleanup to:

1. Remove all invitations
2. Remove any style selections not associated with Tiffany's salon
3. Keep clients associated with Tiffany's salon
4. Remove other clients not associated with Tiffany's salon
5. Remove other salons except for Tiffany's salon

## Results

The cleanup was successful with the following outcomes:

- Tiffany's salon (ID: 42) was preserved
- 4 invitations were deleted
- 0 style selections were deleted (none existed)
- 2 clients belonging to Tiffany's salon were kept
- 0 clients were deleted (no other clients existed)
- 0 other salons were deleted (only Tiffany's salon existed)

## Final Database State

After the cleanup, the database contains:

- 1 salon: Tiffany 5280 Nails Studio
- 2 clients: Both associated with Tiffany's salon
- 0 style selections
- 0 invitations

## How to Run the Cleanup Again

If needed, the cleanup can be run again using:

```bash
./scripts/run-cleanup.sh
```

This will prompt for confirmation before proceeding with the cleanup process.

## Important Notes

- This cleanup preserves only Tiffany's salon data
- All invitations are deleted regardless of association
- The script is designed to keep the minimal viable data needed for the application