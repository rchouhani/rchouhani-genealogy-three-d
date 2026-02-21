/**
 * @fileoverview Route API : /api/persons
 *
 * GET  /api/persons         → liste toutes les personnes
 * POST /api/persons         → crée une nouvelle personne
 */

import { NextResponse } from "next/server";
import { db } from "@/app/db";
import { persons } from "@/app/db/schema";

// ---------------------------------------------------------------------------
// GET /api/persons
// ---------------------------------------------------------------------------

/**
 * Retourne la liste complète des personnes.
 * Les relations sont chargées séparément via /api/relations.
 */
export async function GET() {
  try {
    const all = await db.select().from(persons);
    return NextResponse.json(all);
  } catch (error) {
    console.error("[GET /api/persons]", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des personnes." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/persons
// ---------------------------------------------------------------------------

/**
 * Crée une nouvelle personne.
 *
 * Body attendu :
 * {
 *   firstName: string,
 *   lastName: string,
 *   generation: number,
 *   birthName?: string,
 *   birthDate?: string,
 *   deathDate?: string,
 *   birthLocation?: string,
 *   deathLocation?: string,
 *   photoUrl?: string
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, generation, ...optional } = body;

    if (!firstName || !lastName || generation === undefined) {
      return NextResponse.json(
        { error: "firstName, lastName et generation sont obligatoires." },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(persons)
      .values({ firstName, lastName, generation, ...optional })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[POST /api/persons]", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la personne." },
      { status: 500 }
    );
  }
}
