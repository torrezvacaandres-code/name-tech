import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    logger.warn("Auth callback called without code");
    return NextResponse.redirect(`${origin}/?error=no_code`);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      logger.error("Auth code exchange failed", error, { code: code.substring(0, 10) });
      
      // If this was an email verification, redirect to verify-email page with error
      if (type === "signup" || type === "email") {
        return NextResponse.redirect(`${origin}/auth/verify-email?verified=false`);
      }
      
      return NextResponse.redirect(
        `${origin}/?error=verification_failed&message=${encodeURIComponent(error.message)}`
      );
    }

    logger.info("Auth callback successful", { type });

    // If this was an email verification, redirect to verify-email page with success
    if (type === "signup" || type === "email") {
      return NextResponse.redirect(`${origin}/auth/verify-email?verified=true`);
    }

    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";
    
    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${next}`);
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`);
    } else {
      return NextResponse.redirect(`${origin}${next}`);
    }
  } catch (error) {
    logger.error("Unexpected error in auth callback", error);
    return NextResponse.redirect(`${origin}/?error=server_error`);
  }
}
