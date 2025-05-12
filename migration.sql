-- Add missing columns to invitations table
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS salon_name TEXT;

-- Add missing columns to gifts table
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS sender_phone TEXT;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS salon_name TEXT;

-- Update existing invitations with salon names
UPDATE invitations i
SET salon_name = s.name
FROM salons s
WHERE i.salon_id = s.id AND i.salon_name IS NULL;

-- Update existing gifts with sender names, salon names, and recipient names
UPDATE gifts g
SET sender_name = c.name, 
    sender_phone = c.phone
FROM clients c
WHERE g.sender_id = c.id 
  AND (g.sender_name IS NULL OR g.sender_phone IS NULL);

UPDATE gifts g
SET salon_name = s.name
FROM salons s
WHERE g.salon_id = s.id AND g.salon_name IS NULL;

UPDATE gifts g
SET recipient_name = c.name
FROM clients c
WHERE g.recipient_id = c.id AND g.recipient_name IS NULL;