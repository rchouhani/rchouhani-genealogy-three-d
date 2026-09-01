/**
 * @fileoverview Route API : /api/relations/[id] — version finale avec withUserContext.
 */

import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { relations, persons } from "@/app/db/schema";
import { eq, and } from "drizzle-orm";
import { withUserContext } from "@/app/lib/withUserContext";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  try {
    const result = await withUserContext(userId, async (tx) => {
      const [relation] = await tx
        .select({ sourceId: relations.sourceId })
        .from(relations)
        .where(eq(relations.id, id));

      if (!relation) return { notFound: true as const };

      const [sourceOwned] = await tx
        .select({ id: persons.id })
        .from(persons)
        .where(and(eq(persons.id, relation.sourceId), eq(persons.ownerId, userId)));

      if (!sourceOwned) return { forbidden: true as const };

      const [deleted] = await tx.delete(relations).where(eq(relations.id, id)).returning();
      return { deleted };
    });

    if ("notFound" in result) {
      return NextResponse.json({ error: "Relation introuvable." }, { status: 404 });
    }
    if ("forbidden" in result) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    return NextResponse.json({ success: true, deleted: result.deleted });
  } catch (error) {
    console.error("[DELETE /api/relations/:id]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
