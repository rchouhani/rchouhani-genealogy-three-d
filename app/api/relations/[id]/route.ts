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
 * le client doit faire un second appel (voir handleDeleteRelationInEdit
 * dans page.tsx, qui fait exactement ça).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15+ : params est une Promise, unwrap obligatoire avant .id
    // (voir api/persons/[id]/route.ts pour le contexte complet).
    const { id } = await params;

    const [deleted] = await db
      .delete(relations)
      .where(eq(relations.id, id))
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
