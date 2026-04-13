import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { SwipeItem, CandidateData, BallotMeasureData } from "@/lib/types";

export async function GET() {
  try {
    const sql = getDb();

    const [candidates, measures, candidateTopics, stances, measureTopics] =
      await Promise.all([
        sql`
          SELECT c.*, j.name as j_name, j.abbreviation as j_abbr, j.type as j_type, j.id as j_id
          FROM "Candidate" c
          JOIN "Jurisdiction" j ON c."jurisdictionId" = j.id
          ORDER BY c."sortOrder" ASC
        `,
        sql`
          SELECT m.*, j.name as j_name, j.abbreviation as j_abbr, j.type as j_type, j.id as j_id
          FROM "BallotMeasure" m
          JOIN "Jurisdiction" j ON m."jurisdictionId" = j.id
          ORDER BY m."sortOrder" ASC
        `,
        sql`
          SELECT ct."candidateId", t.*
          FROM "CandidateTopic" ct
          JOIN "Topic" t ON ct."topicId" = t.id
        `,
        sql`SELECT * FROM "Stance"`,
        sql`
          SELECT mt."measureId", t.*
          FROM "MeasureTopic" mt
          JOIN "Topic" t ON mt."topicId" = t.id
        `,
      ]);

    const items: SwipeItem[] = [];

    for (const c of candidates) {
      const cTopics = candidateTopics.filter(
        (ct: any) => ct.candidateId === c.id
      );
      const cStances = stances.filter((s: any) => s.candidateId === c.id);

      const data: CandidateData = {
        id: c.id,
        name: c.name,
        office: c.office,
        party: c.party ?? undefined,
        jurisdiction: {
          id: c.j_id,
          name: c.j_name,
          abbreviation: c.j_abbr,
          type: c.j_type,
        },
        shortSummary: c.shortSummary,
        longSummary: c.longSummary ?? undefined,
        imageUrl: c.imageUrl ?? undefined,
        websiteUrl: c.websiteUrl ?? undefined,
        electionDate: c.electionDate ?? undefined,
        topics: cTopics.map((t: any) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          description: t.description ?? undefined,
          icon: t.icon ?? undefined,
        })),
        stances: cStances.map((s: any) => ({
          id: s.id,
          topic: s.topic,
          position: s.position,
          summary: s.summary,
        })),
      };
      items.push({ type: "candidate", data });
    }

    for (const m of measures) {
      const mTopics = measureTopics.filter(
        (mt: any) => mt.measureId === m.id
      );

      const data: BallotMeasureData = {
        id: m.id,
        title: m.title,
        measureCode: m.measureCode ?? undefined,
        jurisdiction: {
          id: m.j_id,
          name: m.j_name,
          abbreviation: m.j_abbr,
          type: m.j_type,
        },
        electionDate: m.electionDate ?? undefined,
        category: m.category ?? undefined,
        shortSummary: m.shortSummary,
        longSummary: m.longSummary ?? undefined,
        yesMeans: m.yesMeans ?? undefined,
        noMeans: m.noMeans ?? undefined,
        proArguments: m.proArguments ? JSON.parse(m.proArguments) : undefined,
        conArguments: m.conArguments ? JSON.parse(m.conArguments) : undefined,
        topics: mTopics.map((t: any) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          description: t.description ?? undefined,
          icon: t.icon ?? undefined,
        })),
      };
      items.push({ type: "measure", data });
    }

    // Interleave candidates and measures for variety
    const candidateItems = items.filter((i) => i.type === "candidate");
    const measureItems = items.filter((i) => i.type === "measure");
    const interleaved: SwipeItem[] = [];
    const maxLen = Math.max(candidateItems.length, measureItems.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < candidateItems.length) interleaved.push(candidateItems[i]);
      if (i < measureItems.length) interleaved.push(measureItems[i]);
    }

    return NextResponse.json(interleaved);
  } catch (error: any) {
    console.error("API /api/items error:", error);
    return NextResponse.json(
      { error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
