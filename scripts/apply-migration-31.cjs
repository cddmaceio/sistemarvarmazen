const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or service key not provided');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const migrationPath = path.resolve('migrations', '31.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    const { error } = await supabase.rpc('execute_sql', { sql_query: sql });

    if (error) {
      throw new Error(`Error applying migration: ${error.message}`);
    }

    console.log('Migration 31 applied successfully');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

applyMigration();