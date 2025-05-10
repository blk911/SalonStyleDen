-- Add giftHash column to gifts table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gifts' AND column_name = 'gift_hash') THEN
        ALTER TABLE gifts ADD COLUMN gift_hash TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT;
    END IF;
    
    -- Add salonId column to gifts table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gifts' AND column_name = 'salon_id') THEN
        ALTER TABLE gifts ADD COLUMN salon_id INTEGER DEFAULT 1 REFERENCES salons(id);
    END IF;
END
$$;