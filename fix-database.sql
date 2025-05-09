-- Update SQL queries to fix the sponsor_name field
-- This script ensures that all invitations have a proper sponsor_name value

-- Update any null sponsor_name values to use the sponsor field as a fallback
UPDATE invitations 
SET sponsor_name = sponsor 
WHERE sponsor_name IS NULL OR sponsor_name = '';

-- Ensure all future invitations have a default value of "VMB LTD" for sponsor_name if not specified
ALTER TABLE invitations 
ALTER COLUMN sponsor_name SET DEFAULT 'VMB LTD';

-- Ensure the sponsor_name is NOT NULL to match schema expectations
ALTER TABLE invitations 
ALTER COLUMN sponsor_name SET NOT NULL;

-- Display updated records (count) for verification
SELECT COUNT(*) as updated_records FROM invitations WHERE sponsor_name IS NOT NULL;