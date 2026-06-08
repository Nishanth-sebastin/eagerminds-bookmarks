"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { confirmEmail } from "@/lib/actions/auth";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Status = "verifying" | "success" | "error";

export function ConfirmEmail({
  tokenHash,
  type,
}: {
  tokenHash: string;
  type: EmailOtpType;
}) {
  // Derive the missing-token error from initial state so the effect never
  // calls setState synchronously.
  const [status, setStatus] = useState<Status>(
    tokenHash ? "verifying" : "error",
  );
  const [message, setMessage] = useState(
    tokenHash ? "" : "This confirmation link is missing its token.",
  );
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !tokenHash) return; // verifyOtp tokens are single-use
    ran.current = true;

    confirmEmail(tokenHash, type)
      .then((res) => {
        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setMessage(res.error ?? "We couldn't confirm your email.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [tokenHash, type]);

  return (
    <Card className="w-full max-w-sm text-center">
      <CardHeader className="items-center">
        {status === "verifying" && (
          <>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
            </div>
            <CardTitle>Confirming your email…</CardTitle>
            <CardDescription>This will only take a moment.</CardDescription>
          </>
        )}
        {status === "success" && (
          <>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-6" />
            </div>
            <CardTitle>Email confirmed</CardTitle>
            <CardDescription>
              Your account is verified and you&apos;re signed in.
            </CardDescription>
          </>
        )}
        {status === "error" && (
          <>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="size-6" />
            </div>
            <CardTitle>Confirmation failed</CardTitle>
            <CardDescription>{message}</CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent>
        {status === "success" && (
          <Link href="/dashboard" className={buttonVariants({ className: "w-full" })}>
            Go to dashboard
          </Link>
        )}
        {status === "error" && (
          <Link
            href="/login"
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            Back to login
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
