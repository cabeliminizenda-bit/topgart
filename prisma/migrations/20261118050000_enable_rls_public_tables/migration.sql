-- Security (H1): Enable Row Level Security (RLS) on all tables in the public schema.
-- With no permissive policies granted to `anon` or `authenticated`, Supabase PostgREST
-- denies direct external access to all Prisma tables (User, Order, Setting, etc.).
-- Prisma connects with the database owner role (`postgres`), which bypasses RLS.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;
END $$;
