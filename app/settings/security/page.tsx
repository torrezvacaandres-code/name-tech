"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Smartphone, Loader2, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

export default function SecuritySettingsPage() {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkTotpStatus();
  }, []);

  async function checkTotpStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      // Check if TOTP is enabled
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.find((f) => f.status === "verified");
      setTotpEnabled(!!totpFactor);
    } catch (error) {
      logger.error("Error checking TOTP status", error);
    }
  }

  async function enrollTotp() {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator App",
      });

      if (error) throw error;

      if (data) {
        setQrCode(data.totp.qr_code);
        toast.success("Scan the QR code with your authenticator app");
      }
    } catch (error) {
      logger.error("Error enrolling TOTP", error);
      toast.error("Failed to set up 2FA");
    } finally {
      setEnrolling(false);
    }
  }

  async function verifyTotp() {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const factors = await supabase.auth.mfa.listFactors();
      const totpFactor = factors.data?.totp?.[0];

      if (!totpFactor) throw new Error("No TOTP factor found");

      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: totpFactor.id,
        code: verificationCode,
      });

      if (error) throw error;

      toast.success("Two-factor authentication enabled!");
      setQrCode(null);
      setVerificationCode("");
      setTotpEnabled(true);
    } catch (error) {
      logger.error("Error verifying TOTP", error);
      toast.error("Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function disableTotp() {
    if (!confirm("Are you sure you want to disable two-factor authentication?")) {
      return;
    }

    setLoading(true);
    try {
      const factors = await supabase.auth.mfa.listFactors();
      const totpFactor = factors.data?.totp?.find((f) => f.status === "verified");

      if (!totpFactor) throw new Error("No TOTP factor found");

      const { error } = await supabase.auth.mfa.unenroll({
        factorId: totpFactor.id,
      });

      if (error) throw error;

      toast.success("Two-factor authentication disabled");
      setTotpEnabled(false);
    } catch (error) {
      logger.error("Error disabling TOTP", error);
      toast.error("Failed to disable 2FA");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold">Security Settings</h1>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost">Profile</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Two-Factor Authentication</CardTitle>
            </div>
            <CardDescription>
              Add an extra layer of security to your account with time-based one-time passwords (TOTP)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {totpEnabled ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Two-factor authentication is enabled
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your account is protected with 2FA
                    </p>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  onClick={disableTotp}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Disabling...
                    </>
                  ) : (
                    "Disable 2FA"
                  )}
                </Button>
              </div>
            ) : qrCode ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Step 1: Scan QR Code</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    Scan this QR code with an authenticator app like Google Authenticator, Authy, or 1Password
                  </p>
                  <div className="flex justify-center p-4 bg-white rounded-lg border">
                    <img src={qrCode} alt="QR Code for 2FA setup" className="w-48 h-48" />
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Step 2: Verify Code</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    Enter the 6-digit code from your authenticator app
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={verifyTotp} disabled={loading || verificationCode.length !== 6}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Enable"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQrCode(null);
                      setVerificationCode("");
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                  <Smartphone className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Authenticator App Required</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      You'll need an authenticator app like Google Authenticator, Authy, or 1Password installed on your phone
                    </p>
                  </div>
                </div>

                <Button onClick={enrollTotp} disabled={enrolling}>
                  {enrolling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Enable Two-Factor Authentication
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recovery Codes</CardTitle>
            <CardDescription>
              Store these codes in a safe place. You can use them to access your account if you lose your phone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Recovery codes will be available after enabling 2FA
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
