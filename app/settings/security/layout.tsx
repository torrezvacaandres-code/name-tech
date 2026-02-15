import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Settings - name-tech",
  description: "Manage your account security settings",
};

export default function SecuritySettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
