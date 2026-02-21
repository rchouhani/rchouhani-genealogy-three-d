/**
 * @fileoverview Route API : /api/relations/[id]
 *
 * DELETE /api/relations/:id → supprime une relation par ID
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/app/db";
import { relations } from "@/app/db/schema";

// ---------------------------------------------------------------------------
// DELETE /api/relations/:id
// ---------------------------------------------------------------------------

/**
 * Supprime une relation par son ID.
 *
 * Note : supprime uniquement cette entrée.
 * Si la relation inverse doit aussi être supprimée,
 * le client doit faire un second appel ou passer par
 * une route dédiée /api/relations/between/:sourceId/:targetId.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [deleted] = await db
      .delete(relations)
      .where(eq(relations.id, params.id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Relation introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/relations/:id]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
