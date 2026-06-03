"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Signs the user out of Supabase Auth (clears the `@supabase/ssr` cookies) and
 * sends them back to the login page. Triggered from the app shell.
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
