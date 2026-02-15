import { createClient } from "@/lib/supabase/server";
import { profileUpdateSchema } from "@/lib/validations/profile";
import { profileRateLimit, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const { success, limit, remaining, reset } = await profileRateLimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { 
          error: "Too many requests. Please try again later.",
          limit,
          remaining,
          reset,
        },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          }
        }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = profileUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { full_name, phone, avatar_url } = validationResult.data;

    // Update profile in database
    const { data, error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name,
        phone: phone || null,
        avatar_url: avatar_url || null,
      })
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) {
      logger.error("Profile update failed", updateError, { userId: user.id });
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    logger.info("Profile updated successfully", { userId: user.id });

    return NextResponse.json(
      { data },
      {
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        }
      }
    );
  } catch (error) {
    logger.error("Unexpected error in profile update", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
