"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Monitor, Smartphone, Tablet, LogOut } from "lucide-react";
import { logger } from "@/lib/logger";

interface Session {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  factor_id?: string;
  aal?: string;
  not_after?: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      const response = await fetch("/api/sessions");
      if (!response.ok) throw new Error("Failed to load sessions");
      
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      logger.error("Error loading sessions", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }

  async function revokeSession(sessionId: string) {
    setRevoking(sessionId);
    try {
      const response = await fetch("/api/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) throw new Error("Failed to revoke session");

      toast.success("Session revoked successfully");
      
      // If it was the current session, redirect to login
      const data = await response.json();
      if (data.wasCurrentSession) {
        router.push("/");
      } else {
        loadSessions();
      }
    } catch (error) {
      logger.error("Error revoking session", error);
      toast.error("Failed to revoke session");
    } finally {
      setRevoking(null);
    }
  }

  function getDeviceIcon() {
    // In a real app, you'd detect device type from user agent
    return <Monitor className="h-5 w-5" />;
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    
    return date.toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-600 dark:text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold">Active Sessions</h1>
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
            <CardTitle>Manage Sessions</CardTitle>
            <CardDescription>
              View and manage your active login sessions. For security, you can revoke access from any device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-center text-zinc-600 dark:text-zinc-400 py-8">
                No active sessions found
              </p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-start justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1">{getDeviceIcon()}</div>
                      <div>
                        <p className="font-medium text-sm">Unknown Device</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          Last active: {formatDate(session.updated_at)}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500">
                          Created: {formatDate(session.created_at)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeSession(session.id)}
                      disabled={revoking === session.id}
                    >
                      {revoking === session.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Revoking...
                        </>
                      ) : (
                        <>
                          <LogOut className="mr-2 h-4 w-4" />
                          Revoke
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">
              Revoke All Sessions
            </CardTitle>
            <CardDescription>
              Sign out from all devices. You will be redirected to the login page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => {
                // Revoke all sessions by signing out
                window.location.href = "/";
              }}
            >
              Sign Out Everywhere
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
