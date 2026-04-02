import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ENV } from '../config/env';
import * as schema from './schema';

const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  ssl:
    ENV.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

// log when first connection is made
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

// log when an error occurs
pool.on('error', (err) => {
  console.log('❌ Database connection error:', err);
});

export const db = drizzle({ client: pool, schema });

// What is a Connection Pool?
// A connection pool is a cache of database connections that are kept and reused.

// Why use it?
// Opening/closing connections is expensive. Instead of creating a new connection for every query, the pool provides existing connections.

// Databases limit the number of connections they accept. A pool helps manage this limit.
