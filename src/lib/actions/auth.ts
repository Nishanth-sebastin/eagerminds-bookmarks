"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { sendWelcomeEmail } from "@/lib/email";

export type AuthState = { error?: string; message?: string };

const NOT_CONFIGURED =
  "Supabase isn't configured yet. Add your keys to .env.local and restart.";

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

export async function login(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };

  const { email, password } = readCredentials(formData);
  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };

  const { email, password } = readCredentials(formData);
  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Best-effort welcome email — never let a mail failure break signup.
  try {
    await sendWelcomeEmail(email);
  } catch (e) {
    console.error("sendWelcomeEmail threw:", e);
  }

  // If the project has email confirmation enabled, there's no session yet —
  // tell the user to confirm. Otherwise they're signed in immediately.
  if (!data.session) {
    return {
      message: "Check your email to confirm your account, then log in.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
