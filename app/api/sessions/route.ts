import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all sessions for the user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ sessions: [] });
    }

    // Note: Supabase doesn't provide a direct API to list all sessions
    // We can only get the current session
    // For a full implementation, you'd need to track sessions in your database
    const sessions = [
      {
        id: session.access_token.substring(0, 16), // Using part of token as ID
        user_id: user.id,
        created_at: new Date(session.user.created_at).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    return NextResponse.json({ sessions });
  } catch (error) {
    logger.error("Error fetching sessions", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await request.json();

    // Since Supabase doesn't allow revoking specific sessions,
    // we'll sign out the user (which revokes all sessions)
    await supabase.auth.signOut();

    logger.info("Session revoked", { userId: user.id, sessionId });

    return NextResponse.json({ 
      success: true,
      wasCurrentSession: true,
    });
  } catch (error) {
    logger.error("Error revoking session", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
