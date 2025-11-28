import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ifqkqukidrcjtnxbufal.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmcWtxdWtpZHJjanRueGJ1ZmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNzczMzEsImV4cCI6MjA3OTg1MzMzMX0.pbYThproEVD_Y8LY0Uy_q0QIOAzqz5xIQ6dfB1j-7qI';

export const supabase = createClient(supabaseUrl, supabaseKey);
