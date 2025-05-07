-- SQL Script to fix NULL sponsor field values in the database
-- This script ensures all client records have proper sponsor information

-- Get the default salon ID (Tiffany's salon)
DO $$
DECLARE
    default_salon_id INTEGER;
    default_salon_name TEXT;
BEGIN
    -- Find Tiffany's salon
    SELECT id, name INTO default_salon_id, default_salon_name
    FROM salons
    WHERE name = 'Tiffany 5280 Nails Studio'
    LIMIT 1;

    IF default_salon_id IS NULL THEN
        RAISE EXCEPTION 'Default salon not found';
    END IF;

    -- Update clients with missing sponsor information
    UPDATE clients
    SET 
        sponsor = 'VMB LTD',
        sponsor_name = default_salon_name,
        sponsor_salon_id = default_salon_id
    WHERE 
        sponsor_salon_id IS NULL OR 
        sponsor IS NULL OR
        sponsor_name IS NULL;

    -- Update invitations with missing sponsor information
    UPDATE invitations
    SET 
        sponsor = 'VMB LTD',
        sponsor_name = default_salon_name,
        salon_id = default_salon_id
    WHERE 
        salon_id IS NULL OR 
        sponsor IS NULL OR
        sponsor_name IS NULL;
END
$$;