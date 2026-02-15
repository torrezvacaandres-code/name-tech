import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sessions - name-tech",
  description: "Manage your active sessions",
};

export default function SessionsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
