import { createClient } from '@supabase/supabase-js';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Legacy PostgreSQL pool for direct SQL queries (if needed)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Enhanced query function with better error handling (legacy)
export async function query<T extends QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const res: QueryResult<T> = await client.query(text, params);
    return res.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Get a client for transactions (legacy)
export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('contacts').select('count').limit(1);
    if (error) {
      console.error('Supabase connection failed:', error);
      return false;
    }
    console.log('Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Close the pool (useful for graceful shutdown)
export async function closePool(): Promise<void> {
  await pool.end();
}
