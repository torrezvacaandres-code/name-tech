import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email - name-tech",
  description: "Verify your email address",
};

export default function VerifyEmailLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
