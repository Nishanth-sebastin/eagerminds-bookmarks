"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
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

  // The welcome email is sent later, from /auth/confirm, so it only reaches
  // users who actually verify their address.

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

export type ConfirmResult = { ok?: boolean; error?: string };

/**
 * Exchanges an email confirmation token for a session (sets auth cookies) and,
 * for the initial signup, sends the welcome email. Called from the confirm
 * page's client component so the UI can show progress instead of a blank wait.
 */
export async function confirmEmail(
  tokenHash: string,
  type: EmailOtpType,
): Promise<ConfirmResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };
  if (!tokenHash || !type) return { error: "This confirmation link is invalid." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });
  if (error) return { error: error.message };

  if (type === "signup" && data.user?.email) {
    try {
      await sendWelcomeEmail(data.user.email);
    } catch (e) {
      console.error("sendWelcomeEmail threw:", e);
    }
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
