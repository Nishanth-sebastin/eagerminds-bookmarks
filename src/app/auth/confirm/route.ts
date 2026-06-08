import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";

/**
 * Email confirmation handler. Supabase's confirmation email links here with a
 * `token_hash` + `type`; we exchange it for a session (the server client writes
 * the auth cookies) and send the user on to their dashboard.
 *
 * To use this, set the Supabase "Confirm signup" email template's link to:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
 * (or simply disable email confirmation to land on the dashboard immediately).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      // Send the welcome email now that the address is verified — only for the
      // initial signup confirmation, and never let a mail failure block login.
      if (type === "signup" && data.user?.email) {
        try {
          await sendWelcomeEmail(data.user.email);
        } catch (e) {
          console.error("sendWelcomeEmail threw:", e);
        }
      }
      redirect(next);
    }
  }

  redirect("/login?error=Could not confirm email. Try logging in.");
}
