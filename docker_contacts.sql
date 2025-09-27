--
-- PostgreSQL database dump
--

\restrict l0HGnT2W4N9DNT6UxBkDzKLAyzSXxQff4wuBaD7p7L5VmnauwXgrvb5PLMVgggk

-- Dumped from database version 16.10 (Debian 16.10-1.pgdg13+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    image_url text NOT NULL,
    last_contact_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    email text,
    phone text
);


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contacts (id, name, image_url, last_contact_date, created_at, updated_at, email, phone) FROM stdin;
d9210cf1-011e-4902-ab3e-3de8a7508d36	Shayaan Azeem	/uploads/fI5n4NTF_400x400-1758662338637.jpg	2025-09-21	2025-09-23 21:19:04.958989+00	2025-09-23 21:19:04.958989+00	\N	\N
43b3b576-4a19-4863-b54d-1d116cbd5e97	Om Nathwani	/uploads/oVVDJW1o_400x400-1758664667945.jpg	2025-09-10	2025-09-23 21:57:59.96671+00	2025-09-23 21:57:59.96671+00	\N	\N
\.


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: idx_contacts_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_email ON public.contacts USING btree (email) WHERE (email IS NOT NULL);


--
-- Name: idx_contacts_last_contact_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_last_contact_date ON public.contacts USING btree (last_contact_date, created_at);


--
-- Name: idx_contacts_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_phone ON public.contacts USING btree (phone) WHERE (phone IS NOT NULL);


--
-- Name: contacts trg_contacts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- PostgreSQL database dump complete
--

\unrestrict l0HGnT2W4N9DNT6UxBkDzKLAyzSXxQff4wuBaD7p7L5VmnauwXgrvb5PLMVgggk

