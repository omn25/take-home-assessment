-- enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT        NOT NULL,
  image_url          TEXT        NOT NULL,
  last_contact_date  DATE        NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- keep updated_at column fresh
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON contacts;
CREATE TRIGGER trg_contacts_updated_at
BEFORE UPDATE ON contacts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- index for sorting by last_contact_date
CREATE INDEX IF NOT EXISTS idx_contacts_last_contact_date
  ON contacts (last_contact_date ASC, created_at ASC);
