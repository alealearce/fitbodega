import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { listing_id, user_name, rating, body } = await req.json();

    if (!listing_id || !user_name?.trim() || !rating || !body?.trim()) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
    }
    if (body.trim().length < 10) {
      return NextResponse.json({ error: "Review must be at least 10 characters." }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase.from("reviews").insert({
      listing_id,
      user_name:   user_name.trim(),
      rating,
      body:        body.trim(),
      is_approved: false, // pending moderation
    });

    if (error) throw error;

    return NextResponse.json({ message: "Thank you! Your review will appear once approved." });
  } catch (err) {
    console.error("Review submit error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
