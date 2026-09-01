/**
 * @fileoverview Route catch-all NextAuth v5.
 *
 * `handlers` est un objet { GET, POST } (pas des exports nommés directs) —
 * on le déstructure ici puis on réexporte GET/POST, seule forme que
 * Next.js accepte pour une route API (des fonctions nommées GET/POST
 * exportées, pas un objet qui les contient).
 */
import { handlers } from "@/app/lib/auth";

export const { GET, POST } = handlers;
