-- Add email and phone number fields to contacts table
ALTER TABLE contacts 
ADD COLUMN email TEXT,
ADD COLUMN phone TEXT;

-- Add indexes for email and phone search
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts (phone) WHERE phone IS NOT NULL;
