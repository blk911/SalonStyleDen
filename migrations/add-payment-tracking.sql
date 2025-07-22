
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  gift_id INTEGER REFERENCES gifts(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  amount INTEGER NOT NULL, -- amount in cents
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, succeeded, failed, canceled
  custodial_status VARCHAR(50) DEFAULT 'held', -- held, released, refunded
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  released_at TIMESTAMP NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS admin_custody (
  id SERIAL PRIMARY KEY,
  total_funds_held INTEGER DEFAULT 0, -- total amount in custody (cents)
  gift_count INTEGER DEFAULT 0, -- number of gifts in custody
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointment_confirmations (
  id SERIAL PRIMARY KEY,
  gift_id INTEGER REFERENCES gifts(id) ON DELETE CASCADE,
  salon_id INTEGER REFERENCES salons(id),
  client_id INTEGER REFERENCES clients(id),
  appointment_date TIMESTAMP,
  appointment_time VARCHAR(10), -- e.g., "10:00 AM"
  service_type VARCHAR(255),
  confirmed_by_salon BOOLEAN DEFAULT FALSE,
  confirmed_by_client BOOLEAN DEFAULT FALSE,
  salon_confirmed_at TIMESTAMP NULL,
  client_confirmed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

ALTER TABLE gifts 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS appointment_status VARCHAR(50) DEFAULT 'not_available',
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS custodial_amount INTEGER DEFAULT 0, -- amount held by admin in cents
ADD COLUMN IF NOT EXISTS payment_required BOOLEAN DEFAULT FALSE, -- true for "FROM ME" gifts
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE gifts ALTER COLUMN sender_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_gift_id ON payments(gift_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_custodial_status ON payments(custodial_status);

CREATE INDEX IF NOT EXISTS idx_appointment_confirmations_gift_id ON appointment_confirmations(gift_id);
CREATE INDEX IF NOT EXISTS idx_appointment_confirmations_salon_id ON appointment_confirmations(salon_id);
CREATE INDEX IF NOT EXISTS idx_appointment_confirmations_client_id ON appointment_confirmations(client_id);

CREATE INDEX IF NOT EXISTS idx_gifts_payment_status ON gifts(payment_status);
CREATE INDEX IF NOT EXISTS idx_gifts_appointment_status ON gifts(appointment_status);
CREATE INDEX IF NOT EXISTS idx_gifts_payment_required ON gifts(payment_required);

INSERT INTO admin_custody (total_funds_held, gift_count, last_updated) 
VALUES (0, 0, NOW()) 
ON CONFLICT DO NOTHING;

UPDATE gifts 
SET payment_required = TRUE, 
    payment_status = 'unpaid',
    updated_at = NOW()
WHERE sender_id IS NOT NULL;

UPDATE gifts 
SET payment_required = FALSE,
    payment_status = 'not_required',
    appointment_status = 'available',
    updated_at = NOW()
WHERE salon_id IS NOT NULL AND sender_id IS NULL;

COMMENT ON TABLE payments IS 'Tracks Stripe payment transactions for gift purchases';
COMMENT ON TABLE admin_custody IS 'Tracks total funds held in custody by admin until appointment confirmation';
COMMENT ON TABLE appointment_confirmations IS 'Tracks appointment scheduling and confirmation status for paid gifts';

COMMENT ON COLUMN gifts.payment_status IS 'Payment status: unpaid, processing, paid, not_required, failed';
COMMENT ON COLUMN gifts.appointment_status IS 'Appointment availability: not_available, available, requested, confirmed, completed';
COMMENT ON COLUMN gifts.payment_required IS 'Whether payment is required before gift becomes active';
COMMENT ON COLUMN gifts.custodial_amount IS 'Amount held in admin custody (cents) - matches payment amount';
