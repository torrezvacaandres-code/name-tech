import { logger } from "@/lib/logger";

export type SecurityEventType =
  | "new_login"
  | "password_changed"
  | "profile_updated"
  | "suspicious_login"
  | "session_revoked"
  | "oauth_connected";

interface EmailNotificationData {
  to: string;
  userName?: string;
  eventType: SecurityEventType;
  metadata?: {
    ip?: string;
    location?: string;
    device?: string;
    timestamp?: string;
  };
}

export class EmailNotifications {
  /**
   * Send security event notification email
   * In production, this would integrate with an email service like:
   * - SendGrid
   * - Resend
   * - AWS SES
   * - Postmark
   */
  static async sendSecurityNotification(data: EmailNotificationData) {
    const { to, userName, eventType, metadata } = data;

    // Email templates for different events
    const templates: Record<SecurityEventType, { subject: string; body: string }> = {
      new_login: {
        subject: "New login to your account",
        body: this.getNewLoginEmail(userName, metadata),
      },
      password_changed: {
        subject: "Your password was changed",
        body: this.getPasswordChangedEmail(userName, metadata),
      },
      profile_updated: {
        subject: "Your profile was updated",
        body: this.getProfileUpdatedEmail(userName, metadata),
      },
      suspicious_login: {
        subject: "⚠️ Suspicious login attempt detected",
        body: this.getSuspiciousLoginEmail(userName, metadata),
      },
      session_revoked: {
        subject: "A session was revoked from your account",
        body: this.getSessionRevokedEmail(userName, metadata),
      },
      oauth_connected: {
        subject: "New OAuth provider connected",
        body: this.getOAuthConnectedEmail(userName, metadata),
      },
    };

    const { subject, body } = templates[eventType];

    // In production, you would call your email service API here
    // Example with SendGrid:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    await sgMail.send({
      to,
      from: 'security@yourapp.com',
      subject,
      html: body,
    });
    */

    // For now, just log
    logger.info("Email notification sent", {
      to,
      eventType,
      subject,
    });

    // In development, you could also write to a file for testing
    if (process.env.NODE_ENV === "development") {
      console.log("\n=== Email Notification ===");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body:\n${body}`);
      console.log("=========================\n");
    }

    return { success: true };
  }

  private static getNewLoginEmail(
    userName: string | undefined,
    metadata: EmailNotificationData["metadata"]
  ): string {
    return `
      <h2>New login detected</h2>
      <p>Hi ${userName || "there"},</p>
      <p>We detected a new login to your account:</p>
      <ul>
        <li><strong>Time:</strong> ${metadata?.timestamp || new Date().toLocaleString()}</li>
        <li><strong>IP Address:</strong> ${metadata?.ip || "Unknown"}</li>
        <li><strong>Device:</strong> ${metadata?.device || "Unknown"}</li>
        <li><strong>Location:</strong> ${metadata?.location || "Unknown"}</li>
      </ul>
      <p>If this was you, you can ignore this email.</p>
      <p>If you don't recognize this login, please secure your account immediately by changing your password.</p>
    `;
  }

  private static getPasswordChangedEmail(
    userName: string | undefined,
    metadata: EmailNotificationData["metadata"]
  ): string {
    return `
      <h2>Password changed</h2>
      <p>Hi ${userName || "there"},</p>
      <p>Your password was successfully changed on ${metadata?.timestamp || new Date().toLocaleString()}.</p>
      <p>If you did not make this change, please contact our support team immediately.</p>
    `;
  }

  private static getProfileUpdatedEmail(
    userName: string | undefined,
    metadata: EmailNotificationData["metadata"]
  ): string {
    return `
      <h2>Profile updated</h2>
      <p>Hi ${userName || "there"},</p>
      <p>Your profile information was updated on ${metadata?.timestamp || new Date().toLocaleString()}.</p>
      <p>If you did not make this change, please review your account security settings.</p>
    `;
  }

  private static getSuspiciousLoginEmail(
    userName: string | undefined,
    metadata: EmailNotificationData["metadata"]
  ): string {
    return `
      <h2>⚠️ Suspicious login attempt</h2>
      <p>Hi ${userName || "there"},</p>
      <p>We detected a suspicious login attempt to your account:</p>
      <ul>
        <li><strong>Time:</strong> ${metadata?.timestamp || new Date().toLocaleString()}</li>
        <li><strong>IP Address:</strong> ${metadata?.ip || "Unknown"}</li>
        <li><strong>Location:</strong> ${metadata?.location || "Unknown"}</li>
      </ul>
      <p><strong>Action Required:</strong> If this was not you, we recommend:</p>
      <ol>
        <li>Change your password immediately</li>
        <li>Review your active sessions</li>
        <li>Enable two-factor authentication</li>
      </ol>
    `;
  }

  private static getSessionRevokedEmail(
    userName: string | undefined,
    metadata: EmailNotificationData["metadata"]
  ): string {
    return `
      <h2>Session revoked</h2>
      <p>Hi ${userName || "there"},</p>
      <p>A session was revoked from your account on ${metadata?.timestamp || new Date().toLocaleString()}.</p>
      <p>If you did not perform this action, please review your account security.</p>
    `;
  }

  private static getOAuthConnectedEmail(
    userName: string | undefined,
    metadata: EmailNotificationData["metadata"]
  ): string {
    return `
      <h2>OAuth provider connected</h2>
      <p>Hi ${userName || "there"},</p>
      <p>A new OAuth provider was connected to your account on ${metadata?.timestamp || new Date().toLocaleString()}.</p>
      <p>If you did not authorize this connection, please disconnect it from your account settings.</p>
    `;
  }
}
