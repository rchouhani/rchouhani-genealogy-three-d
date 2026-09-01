/**
 * @fileoverview Route API : /api/persons — version finale avec withUserContext.
 * Chaque requête passe maintenant par withUserContext, qui pose
 * `SET LOCAL app.current_user_id` avant d'exécuter — préparation pour RLS
 * (étape 5). Le filtre .where(eq(persons.ownerId, userId)) explicite reste
 * en place : défense en profondeur, RLS filtrera EN PLUS une fois activé.
 */

import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { persons } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { encryptPersonFields, decryptPersonFields } from "@/app/lib/crypto";
import { withUserContext } from "@/app/lib/withUserContext";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  try {
    const ownPersons = await withUserContext(userId, (tx) =>
      tx.select().from(persons).where(eq(persons.ownerId, userId))
    );

    return NextResponse.json(ownPersons.map(decryptPersonFields));
  } catch (error) {
    console.error("[GET /api/persons]", error);
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
    const body = await request.json();
    const encrypted = encryptPersonFields(body);

    const [created] = await withUserContext(userId, (tx) =>
      tx.insert(persons).values({ ...encrypted, ownerId: userId }).returning()
    );

    return NextResponse.json(decryptPersonFields(created), { status: 201 });
  } catch (error) {
    console.error("[POST /api/persons]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
