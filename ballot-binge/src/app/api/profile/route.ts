import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, party, city, state, email } = body;

    const sql = getDb();
    const id =
      Math.random().toString(36).substring(2) + Date.now().toString(36);

    await sql`
      INSERT INTO "UserProfile" (id, name, party, city, state, email, "createdAt")
      VALUES (${id}, ${name || null}, ${party || null}, ${city || null}, ${state || null}, ${email || null}, NOW())
    `;

    return NextResponse.json({ id });
  } catch (error: any) {
    console.error("API /api/profile error:", error);
    return NextResponse.json(
      { error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
