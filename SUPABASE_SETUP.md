# Supabase Migration Guide

This guide will help you set up Supabase for your contacts app.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. A new Supabase project created

## Setup Steps

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `contacts-app` (or your preferred name)
   - Database Password: Generate a strong password
   - Region: Choose the closest to your users
5. Click "Create new project"

### 2. Get Your Project Credentials

1. In your Supabase dashboard, go to Settings → API
2. Copy the following values:
   - Project URL (looks like: `https://your-project.supabase.co`)
   - `anon` `public` key
   - `service_role` `secret` key

### 3. Set Environment Variables

Create a `.env.local` file in your project root with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 4. Run Database Migrations

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste it into the SQL Editor and run it

Alternatively, you can use the Supabase CLI:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Initialize Supabase in your project
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 5. Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. The app should now connect to Supabase instead of the local PostgreSQL database.

## Migration from Local Database

If you have existing data in your local database, you'll need to export and import it:

### Export from Local Database

```bash
# Connect to your local database and export data
pg_dump -h localhost -p 5432 -U appuser -d contacts_db --data-only --inserts > data_export.sql
```

### Import to Supabase

1. Clean the export file to remove any local-specific references
2. In Supabase SQL Editor, run the cleaned SQL file

## Features Enabled

With Supabase, you now have access to:

- **Real-time subscriptions**: Listen to database changes in real-time
- **Row Level Security**: Built-in security policies
- **Authentication**: Ready-to-use auth system (if needed later)
- **Storage**: File storage for contact images
- **Edge Functions**: Serverless functions for complex logic

## Troubleshooting

### Connection Issues

- Verify your environment variables are correctly set
- Check that your Supabase project is active
- Ensure the service role key has the correct permissions

### Migration Issues

- Make sure the migration SQL runs without errors
- Check that all tables and indexes are created properly
- Verify RLS policies are in place if needed

### API Issues

- Check the Supabase dashboard logs for any errors
- Verify that your API routes are using the correct Supabase client
- Test individual API endpoints to isolate issues

## Next Steps

1. **Optional**: Set up Supabase Auth for user authentication
2. **Optional**: Configure Supabase Storage for image uploads
3. **Optional**: Add real-time subscriptions for live updates
4. **Optional**: Set up proper RLS policies for data security

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub](https://github.com/supabase/supabase)

