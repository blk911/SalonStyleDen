-- Fix database schema and data issues

-- 1. Update default sponsor values for consistency
UPDATE invitations SET sponsor = 'VMB LTD' WHERE sponsor = 'Ven Me, Baby! LTD' OR sponsor IS NULL;
UPDATE clients SET sponsor = 'VMB LTD' WHERE sponsor = 'Ven Me, Baby! LTD' OR sponsor IS NULL;
UPDATE salons SET sponsor = 'VMB LTD' WHERE sponsor = 'Ven Me, Baby! LTD' OR sponsor IS NULL;

-- 2. Add the missing style fields to invitations table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'style_option') THEN
        ALTER TABLE invitations ADD COLUMN style_option TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'style_price') THEN
        ALTER TABLE invitations ADD COLUMN style_price INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'style_duration') THEN
        ALTER TABLE invitations ADD COLUMN style_duration INTEGER;
    END IF;
END
$$;

-- 3. Add the sender_id column to invitations table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'sender_id') THEN
        ALTER TABLE invitations ADD COLUMN sender_id INTEGER;
    END IF;
END
$$;

-- 4. If we need to keep client_id column data before removing it, migrate to sender_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'client_id') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'sender_id') THEN
        -- Copy any non-null client_id values to sender_id if sender_id is null
        UPDATE invitations 
        SET sender_id = client_id 
        WHERE client_id IS NOT NULL AND sender_id IS NULL;
        
        -- Now client_id data is preserved, it can be safely removed later with:
        -- ALTER TABLE invitations DROP COLUMN client_id;
    END IF;
END
$$;

-- 5. Display current table structure for confirmation
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invitations'
ORDER BY ordinal_position;