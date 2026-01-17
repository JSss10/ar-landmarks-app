import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import Auth from "./components/Auth";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user ?? null;

  return <Auth user={user} />;
}