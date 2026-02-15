import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile | Name Tech",
  description: "Edit your profile information and manage your account settings",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
