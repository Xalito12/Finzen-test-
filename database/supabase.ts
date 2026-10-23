import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Reemplaza con los valores de tu proyecto en Supabase (Settings -> API)
const supabaseUrl = 'https://wgkjcrpsszwwrckatpsi.supabase.co';
const supabaseAnonKey = 'sb_publishable_IZXXirOjkylS67Pljj5MrQ_HMd_0yBA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});