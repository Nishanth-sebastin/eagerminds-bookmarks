import { Resend } from "resend";

/**
 * Server-only email helpers (Resend). RESEND_API_KEY must never reach the
 * browser. Sending is best-effort: a failure here must never block signup.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Bookmarks <onboarding@resend.dev>";

export function isEmailConfigured(): boolean {
  return Boolean(RESEND_API_KEY);
}

export async function sendWelcomeEmail(to: string): Promise<void> {
  if (!RESEND_API_KEY) return; // email is optional; no-op when unconfigured

  const resend = new Resend(RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Welcome to Bookmarks 🔖",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #18181b;">
        <h1 style="font-size: 20px; margin: 0 0 12px;">Welcome to Bookmarks!</h1>
        <p style="font-size: 14px; line-height: 1.6; color: #3f3f46;">
          Thanks for signing up. You can now save links, keep them private, and
          share a public profile at your own <strong>@handle</strong>.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #3f3f46;">
          Head to your dashboard to add your first bookmark.
        </p>
        <p style="font-size: 12px; color: #a1a1aa; margin-top: 24px;">
          You're receiving this because someone signed up with this email at
          Bookmarks. If that wasn't you, you can ignore this message.
        </p>
      </div>
    `,
  });

  if (error) {
    // Surface to server logs without throwing — signup must still succeed.
    console.error("Failed to send welcome email:", error);
  }
}
