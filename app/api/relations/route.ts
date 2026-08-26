/**
 * @fileoverview Route API : /api/relations
 *
 * GET  /api/relations   → liste toutes les relations
 * POST /api/relations   → crée une relation entre deux personnes
 *
 * Les relations sont bidirectionnelles dans l'UI mais stockées
 * en deux entrées distinctes en base (une dans chaque sens).
 * C'est la route POST qui crée les deux entrées.
 */

import { NextResponse } from "next/server";
import { db } from "@/app/db";
import { relations } from "@/app/db/schema";

// ---------------------------------------------------------------------------
// GET /api/relations
// ---------------------------------------------------------------------------

/**
 * Retourne toutes les relations.
 * Utilisé pour construire le graphe côté client.
 */
export async function GET() {
  try {
    const all = await db.select().from(relations);
    return NextResponse.json(all);
  } catch (error) {
    console.error("[GET /api/relations]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/relations
// ---------------------------------------------------------------------------

/**
 * Crée une relation bidirectionnelle entre deux personnes.
 *
 * Crée deux entrées :
 *   - sourceId → targetId (type direct)
 *   - targetId → sourceId (type inverse)
 *
 * Body attendu :
 * {
 *   sourceId: string,   // UUID de la personne source
 *   targetId: string,   // UUID de la personne cible
 *   type: "parent" | "child" | "sibling" | "spouse"
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sourceId, targetId, type } = body;

    if (!sourceId || !targetId || !type) {
      return NextResponse.json(
        { error: "sourceId, targetId et type sont obligatoires." },
        { status: 400 }
      );
    }

    // Création d'UNE SEULE relation
    // Le front appelle deux fois POST pour créer les deux sens
    const [created] = await db
      .insert(relations)
      .values({ sourceId, targetId, type })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[POST /api/relations]", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la relation." },
      { status: 500 }
    );
  }
}
