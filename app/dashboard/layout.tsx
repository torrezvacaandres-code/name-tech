import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Name Tech",
  description: "Your personal dashboard - manage your account and view your information",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
