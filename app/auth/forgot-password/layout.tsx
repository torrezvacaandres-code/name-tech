import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | Name Tech",
  description: "Reset your password - we'll send you a recovery email",
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
