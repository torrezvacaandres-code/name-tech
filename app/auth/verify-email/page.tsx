"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");

  useEffect(() => {
    // Check if we came from a successful email verification
    const params = new URLSearchParams(window.location.search);
    const verified = params.get("verified");

    if (verified === "true") {
      setStatus("success");
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } else if (verified === "false") {
      setStatus("error");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "pending" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
                <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Check your email</CardTitle>
              <CardDescription>
                We've sent you a verification link. Please check your inbox and click the link to verify your account.
              </CardDescription>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Email verified!</CardTitle>
              <CardDescription>
                Your email has been successfully verified. Redirecting to dashboard...
              </CardDescription>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>Verification failed</CardTitle>
              <CardDescription>
                The verification link is invalid or has expired. Please try signing up again.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "pending" && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-600 dark:text-zinc-400" />
              </div>
              <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                Didn't receive the email? Check your spam folder or try signing up again.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-600 dark:text-zinc-400" />
              <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                Redirecting...
              </span>
            </div>
          )}

          {status === "error" && (
            <Link href="/" className="block">
              <Button className="w-full">
                Back to Login
              </Button>
            </Link>
          )}

          {status === "pending" && (
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                Back to Login
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
