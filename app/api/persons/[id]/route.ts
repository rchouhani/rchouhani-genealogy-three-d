/**
 * @fileoverview Route API : /api/persons/[id]
 *
 * GET    /api/persons/:id   → récupère une personne par ID
 * PATCH  /api/persons/:id   → met à jour une personne
 * DELETE /api/persons/:id   → supprime une personne (cascade sur les relations)
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/app/db";
import { persons } from "@/app/db/schema";

// ---------------------------------------------------------------------------
// GET /api/persons/:id
// ---------------------------------------------------------------------------

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [person] = await db
      .select()
      .from(persons)
      .where(eq(persons.id, params.id));

    if (!person) {
      return NextResponse.json(
        { error: "Personne introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json(person);
  } catch (error) {
    console.error("[GET /api/persons/:id]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/persons/:id
// ---------------------------------------------------------------------------

/**
 * Met à jour les champs fournis.
 * Seuls les champs présents dans le body sont modifiés.
 *
 * Body : n'importe quel sous-ensemble des champs de Person.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const [updated] = await db
      .update(persons)
      .set(body)
      .where(eq(persons.id, params.id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Personne introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/persons/:id]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/persons/:id
// ---------------------------------------------------------------------------

/**
 * Supprime une personne.
 * Les relations associées sont supprimées automatiquement (onDelete: cascade).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [deleted] = await db
      .delete(persons)
      .where(eq(persons.id, params.id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Personne introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/persons/:id]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
