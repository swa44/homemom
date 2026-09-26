export const supabaseUrl = process.env.NEXT_PUBLIC_HOMEMOM_SUPABASE_URL;
export const supabasePublishableKey = process.env.NEXT_PUBLIC_HOMEMOM_SUPABASE_PUBLISHABLE_KEY;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function requireSupabaseConfig() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }
  return { supabaseUrl, supabasePublishableKey };
}
