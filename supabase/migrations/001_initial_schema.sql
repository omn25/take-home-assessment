-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name               TEXT        NOT NULL,
  image_url          TEXT        NOT NULL,
  last_contact_date  DATE        NOT NULL,
  email              TEXT,
  phone              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to keep updated_at column fresh
DROP TRIGGER IF EXISTS trg_contacts_updated_at ON contacts;
CREATE TRIGGER trg_contacts_updated_at
BEFORE UPDATE ON contacts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_last_contact_date
  ON contacts (last_contact_date ASC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_contacts_email 
  ON contacts (email) WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_phone 
  ON contacts (phone) WHERE phone IS NOT NULL;

-- Create index for name search
CREATE INDEX IF NOT EXISTS idx_contacts_name 
  ON contacts USING gin (to_tsvector('english', name));

-- Enable Row Level Security (RLS)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- Note: You may want to adjust this based on your authentication needs
CREATE POLICY "Allow all operations for authenticated users" ON contacts
  FOR ALL USING (true) WITH CHECK (true);
