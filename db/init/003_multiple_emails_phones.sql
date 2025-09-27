-- Create separate tables for emails and phones
CREATE TABLE IF NOT EXISTS contact_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_phones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contact_emails_updated_at ON contact_emails;
CREATE TRIGGER trg_contact_emails_updated_at
BEFORE UPDATE ON contact_emails
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_contact_phones_updated_at ON contact_phones;
CREATE TRIGGER trg_contact_phones_updated_at
BEFORE UPDATE ON contact_phones
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_emails_contact_id ON contact_emails (contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_emails_email ON contact_emails (email);
CREATE INDEX IF NOT EXISTS idx_contact_emails_primary ON contact_emails (contact_id, is_primary) WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_contact_phones_contact_id ON contact_phones (contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_phones_phone ON contact_phones (phone);
CREATE INDEX IF NOT EXISTS idx_contact_phones_primary ON contact_phones (contact_id, is_primary) WHERE is_primary = true;

-- Migrate existing email and phone data to new tables
INSERT INTO contact_emails (contact_id, email, is_primary)
SELECT id, email, true
FROM contacts 
WHERE email IS NOT NULL AND email != '';

INSERT INTO contact_phones (contact_id, phone, is_primary)
SELECT id, phone, true
FROM contacts 
WHERE phone IS NOT NULL AND phone != '';

-- Remove old email and phone columns from contacts table
ALTER TABLE contacts DROP COLUMN IF EXISTS email;
ALTER TABLE contacts DROP COLUMN IF EXISTS phone;

-- Create function to ensure only one primary email per contact
CREATE OR REPLACE FUNCTION ensure_single_primary_email()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this email as primary, unset all other primary emails for this contact
  IF NEW.is_primary = true THEN
    UPDATE contact_emails 
    SET is_primary = false 
    WHERE contact_id = NEW.contact_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to ensure only one primary phone per contact
CREATE OR REPLACE FUNCTION ensure_single_primary_phone()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this phone as primary, unset all other primary phones for this contact
  IF NEW.is_primary = true THEN
    UPDATE contact_phones 
    SET is_primary = false 
    WHERE contact_id = NEW.contact_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to ensure single primary email/phone
DROP TRIGGER IF EXISTS trg_ensure_single_primary_email ON contact_emails;
CREATE TRIGGER trg_ensure_single_primary_email
BEFORE INSERT OR UPDATE ON contact_emails
FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_email();

DROP TRIGGER IF EXISTS trg_ensure_single_primary_phone ON contact_phones;
CREATE TRIGGER trg_ensure_single_primary_phone
BEFORE INSERT OR UPDATE ON contact_phones
FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_phone();
