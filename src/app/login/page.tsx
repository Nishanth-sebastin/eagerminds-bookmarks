import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";
import { login, type AuthState } from "@/lib/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  const initialState: AuthState = { error, message };
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <AuthForm mode="login" action={login} initialState={initialState} />
      </main>
    </>
  );
}
