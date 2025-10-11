import { DatabaseAdapter } from '../types';

let cachedDbAdapter: DatabaseAdapter | null = null;

export async function getDb(): Promise<DatabaseAdapter> {
  if (cachedDbAdapter) {
    return cachedDbAdapter;
  }

  const provider = process.env.DATABASE_PROVIDER;

  switch (provider) {
    case 'supabase':
      cachedDbAdapter = (await import('../functions')).SupabaseAdapter;
      break;
    default:
      throw new Error(`Unsupported database provider: ${provider}. Please set DATABASE_PROVIDER in .env to "supabase", "mongodb", or "firebase".`);
  }
  
  return cachedDbAdapter;
}