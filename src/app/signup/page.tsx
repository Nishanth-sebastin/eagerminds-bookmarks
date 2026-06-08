import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";
import { signup } from "@/lib/actions/auth";

export default function SignupPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <AuthForm mode="signup" action={signup} />
      </main>
    </>
  );
}
