import type { EmailOtpType } from "@supabase/supabase-js";
import { ConfirmEmail } from "@/components/confirm-email";
import { SiteHeader } from "@/components/site-header";

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string }>;
}) {
  const { token_hash, type } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <ConfirmEmail
          tokenHash={token_hash ?? ""}
          type={(type as EmailOtpType) ?? "signup"}
        />
      </main>
    </>
  );
}
