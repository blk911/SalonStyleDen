-- Salon Purge Script
-- This SQL script will delete all salon records except for:
-- - Tiffany 5280 Nails Studio
-- - Deb Dazzles
-- - Jenna's Glamour Nails
-- - Ven Me, Baby! LTD

-- First, show the salons we'll keep for verification
SELECT id, name FROM salons 
WHERE 
    name ILIKE '%tiffany%5280%' OR 
    name ILIKE '%deb%dazzle%' OR 
    name ILIKE '%jenna%glamour%' OR 
    name ILIKE '%ven%me%baby%';

-- Store the IDs of salons to keep
CREATE TEMP TABLE keep_salons AS
SELECT id FROM salons 
WHERE 
    name ILIKE '%tiffany%5280%' OR 
    name ILIKE '%deb%dazzle%' OR 
    name ILIKE '%jenna%glamour%' OR 
    name ILIKE '%ven%me%baby%';

-- Show what will be deleted - for verification
SELECT id, name FROM salons WHERE id NOT IN (SELECT id FROM keep_salons);

-- Delete related invitations first
DELETE FROM invitations 
WHERE "salonId" IN (
    SELECT id FROM salons 
    WHERE id NOT IN (SELECT id FROM keep_salons)
);

-- Delete related clients next
DELETE FROM clients 
WHERE "salonId" IN (
    SELECT id FROM salons 
    WHERE id NOT IN (SELECT id FROM keep_salons)
);

-- Finally delete the salons
DELETE FROM salons 
WHERE id NOT IN (SELECT id FROM keep_salons);

-- Verify the remaining salons
SELECT id, name FROM salons ORDER BY id;