import { createClient } from "@supabase/supabase-js";

const isProduction = import.meta.env.PUBLIC_RUNTIME_ENVIRONMENT === 'production';
const projectID = isProduction ? import.meta.env.SUPABASE_PROJECT_REF : import.meta.env.SUPABASE_PROJECT_REF_DEV;
const anonKey = isProduction ? import.meta.env.SUPABASE_ANON_KEY : import.meta.env.SUPABASE_ANON_KEY_DEV;
const serviceRoleKey = isProduction ? import.meta.env.SUPABASE_SERVICE_ROLE_KEY : import.meta.env.SUPABASE_SERVICE_ROLE_KEY_DEV;

export const supabase = createClient(`https://${projectID}.supabase.co`, anonKey);
export const supabaseAdmin = createClient(`https://${projectID}.supabase.co`, serviceRoleKey);
