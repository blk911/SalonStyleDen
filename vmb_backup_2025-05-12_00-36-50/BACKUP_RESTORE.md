# VMB Project Backup and Restore Information

## Latest Backup
- **Timestamp**: 2025-04-30_20-57-35
- **Designation**: CL-MKT-ID;MVP-1A
- **Description**: Special marketing test page with fixed layout
- **Status**: Pre-index-page conversion backup

## Backup Details
- Carousel timing: 3.5 seconds per slide, 1.75 seconds freeze on last slide
- Hero section tagline: "Empowering. Personal. Connection."
- Carousel section title: "Ven Me, Baby! Makes Connections Happen!"

## Restoration Instructions

To restore this backup:

1. Stop the current application workflow:
   ```
   # No need to run this command, just press the Stop button in the workflow
   ```

2. Copy backup files back to their original locations:
   ```
   cp -r vmb_backup_2025-04-30_20-57-35/client .
   cp -r vmb_backup_2025-04-30_20-57-35/server .
   cp -r vmb_backup_2025-04-30_20-57-35/shared .
   ```

3. Restart the application workflow:
   ```
   # Just press the Start button in the workflow
   ```

## Note
This backup preserves the state prior to implementing the index page redirection to the Clients page for marketing testing. The backup contains the fixed layout marketing test page (CL-MKT-ID;MVP-1A) that should not be structurally modified.