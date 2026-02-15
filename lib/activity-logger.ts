import { logger } from "@/lib/logger";
import { EmailNotifications, type SecurityEventType } from "@/lib/email-notifications";

export type ActivityType =
  | "login"
  | "logout"
  | "signup"
  | "password_reset"
  | "profile_update"
  | "avatar_upload"
  | "session_revoked"
  | "oauth_login"
  | "failed_login";

interface ActivityData {
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export class ActivityLogger {
  static log(type: ActivityType, data: ActivityData) {
    const timestamp = new Date().toISOString();
    
    const logEntry = {
      timestamp,
      type,
      userId: data.userId,
      email: data.email,
      ip: data.ip,
      userAgent: data.userAgent,
      metadata: data.metadata,
    };

    // Log to console (in production, this would go to a database or analytics service)
    logger.info(`[ACTIVITY] ${type}`, logEntry);

    // Send email notifications for security events
    if (data.email && this.shouldNotifyByEmail(type)) {
      const eventType = this.mapToSecurityEvent(type);
      if (eventType) {
        EmailNotifications.sendSecurityNotification({
          to: data.email,
          eventType,
          metadata: {
            ip: data.ip,
            timestamp,
          },
        }).catch((error) => {
          logger.error("Failed to send email notification", error);
        });
      }
    }

    // In a real implementation, you would also:
    // 1. Store in a database table (activity_logs)
    // 2. Send to analytics service (Mixpanel, Amplitude, etc.)
    // 3. Trigger alerts for suspicious activities
    // 4. Update user's last_activity_at timestamp

    return logEntry;
  }

  private static shouldNotifyByEmail(type: ActivityType): boolean {
    // Configure which activities should trigger email notifications
    const notifiableEvents: ActivityType[] = [
      "login",
      "failed_login",
      "password_reset",
      "session_revoked",
      "oauth_login",
    ];
    return notifiableEvents.includes(type);
  }

  private static mapToSecurityEvent(type: ActivityType): SecurityEventType | null {
    const mapping: Partial<Record<ActivityType, SecurityEventType>> = {
      login: "new_login",
      failed_login: "suspicious_login",
      password_reset: "password_changed",
      session_revoked: "session_revoked",
      oauth_login: "oauth_connected",
    };
    return mapping[type] || null;
  }

  static async logToDatabase(type: ActivityType, data: ActivityData) {
    // This would be implemented with a database call
    // Example with Supabase:
    /*
    const supabase = await createClient();
    await supabase.from('activity_logs').insert({
      type,
      user_id: data.userId,
      ip_address: data.ip,
      user_agent: data.userAgent,
      metadata: data.metadata,
      created_at: new Date().toISOString(),
    });
    */
    
    // For now, just log
    this.log(type, data);
  }
}
