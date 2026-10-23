import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wgkjcrpsszwwrckatpsi.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indna2pjcnBzc3p3d3Jja2F0cHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3Nzk5NzksImV4cCI6MjEwODM1NTk3OX0.ADXGJxUBsfoAccOktX2VUG6ZzP0EY4J3Kg5QR0de4OA';

export const supabase = createClient(supabaseUrl, supabaseKey);