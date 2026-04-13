import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, itemType, itemId, choice } = body;

    if (!sessionId || !itemType || !itemId || !choice) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const sql = getDb();
    const id =
      Math.random().toString(36).substring(2) + Date.now().toString(36);
    const candidateId = itemType === "candidate" ? itemId : null;
    const measureId = itemType === "measure" ? itemId : null;

    await sql`
      INSERT INTO "Swipe" (id, "sessionId", "itemType", "candidateId", "measureId", choice, "createdAt")
      VALUES (${id}, ${sessionId}, ${itemType}, ${candidateId}, ${measureId}, ${choice}, NOW())
    `;

    return NextResponse.json({ id, sessionId, itemType, choice });
  } catch (error: any) {
    console.error("API /api/swipes error:", error);
    return NextResponse.json(
      { error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
