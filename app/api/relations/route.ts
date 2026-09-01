/**
 * @fileoverview Route API : /api/relations — version finale avec withUserContext.
 */

import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { relations, persons } from "@/app/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { withUserContext } from "@/app/lib/withUserContext";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  try {
    const ownRelations = await withUserContext(userId, (tx) =>
      tx
        .select({
          id: relations.id,
          sourceId: relations.sourceId,
          targetId: relations.targetId,
          type: relations.type,
          createdAt: relations.createdAt,
        })
        .from(relations)
        .innerJoin(persons, eq(relations.sourceId, persons.id))
        .where(eq(persons.ownerId, userId))
    );

    return NextResponse.json(ownRelations);
  } catch (error) {
    console.error("[GET /api/relations]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  try {
    const { sourceId, targetId, type } = await request.json();

    if (!sourceId || !targetId || !type) {
      return NextResponse.json(
        { error: "sourceId, targetId et type sont obligatoires." },
        { status: 400 }
      );
    }

    const created = await withUserContext(userId, async (tx) => {
      const owned = await tx
        .select({ id: persons.id })
        .from(persons)
        .where(and(inArray(persons.id, [sourceId, targetId]), eq(persons.ownerId, userId)));

      if (owned.length !== 2) {
        throw new Error("FORBIDDEN");
      }

      const [row] = await tx.insert(relations).values({ sourceId, targetId, type }).returning();
      return row;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Une des personnes n'existe pas ou ne t'appartient pas." },
        { status: 403 }
      );
    }
    console.error("[POST /api/relations]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
