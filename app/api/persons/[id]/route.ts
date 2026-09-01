/**
 * @fileoverview Route API : /api/persons/[id] — version finale avec withUserContext.
 */

import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { persons } from "@/app/db/schema";
import { eq, and } from "drizzle-orm";
import { encryptPersonFields, decryptPersonFields } from "@/app/lib/crypto";
import { withUserContext } from "@/app/lib/withUserContext";

export async function GET(
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
    const [person] = await withUserContext(userId, (tx) =>
      tx.select().from(persons).where(and(eq(persons.id, id), eq(persons.ownerId, userId)))
    );

    if (!person) {
      return NextResponse.json({ error: "Personne introuvable." }, { status: 404 });
    }

    return NextResponse.json(decryptPersonFields(person));
  } catch (error) {
    console.error("[GET /api/persons/:id]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  try {
    const body = await request.json();
    const encrypted = encryptPersonFields(body);

    const [updated] = await withUserContext(userId, (tx) =>
      tx
        .update(persons)
        .set(encrypted)
        .where(and(eq(persons.id, id), eq(persons.ownerId, userId)))
        .returning()
    );

    if (!updated) {
      return NextResponse.json({ error: "Personne introuvable." }, { status: 404 });
    }

    return NextResponse.json(decryptPersonFields(updated));
  } catch (error) {
    console.error("[PATCH /api/persons/:id]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

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
    const [deleted] = await withUserContext(userId, (tx) =>
      tx
        .delete(persons)
        .where(and(eq(persons.id, id), eq(persons.ownerId, userId)))
        .returning()
    );

    if (!deleted) {
      return NextResponse.json({ error: "Personne introuvable." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/persons/:id]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
