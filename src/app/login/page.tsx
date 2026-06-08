import { AuthForm } from "@/components/auth-form";
import { login, type AuthState } from "@/lib/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  const initialState: AuthState = { error, message };
  return <AuthForm mode="login" action={login} initialState={initialState} />;
}
