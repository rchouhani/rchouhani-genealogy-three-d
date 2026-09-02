/**
 * @fileoverview Proxy Next.js 16 — protection au niveau routeur.
 *
 * Remplace middleware.ts (déprécié depuis Next.js 16, toujours disponible
 * mais en voie de suppression). Fonctionne sur le runtime Node.js (pas
 * Edge) — cohérent avec NextAuth v5 qui a parfois des limitations sur
 * Edge Runtime.
 *
 * `auth` (exporté par app/lib/auth.ts) réexporté comme `proxy` : NextAuth
 * redirige automatiquement vers la page de connexion tout visiteur non
 * authentifié sur les routes matchées.
 *
 * Pourquoi ici plutôt que dans page.tsx : le visiteur non connecté ne
 * voit JAMAIS la page (ni son état de chargement, ni un message d'erreur
 * générique) — la redirection intervient avant même que le composant
 * React ne s'exécute.
 *
 * matcher volontairement restreint à "/" : on ne protège PAS les routes
 * /api/* ici, elles gèrent déjà leur propre vérification (auth() +
 * retour 401 JSON dans chaque route). Rediriger une requête fetch() vers
 * une page HTML de connexion n'aurait aucun sens côté client — donc les
 * API restent en 401 explicite, seule la page complète est redirigée.
 */
import { auth } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
    if(!req.auth) {
        const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
        signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
});

export const config = {
  matcher: ["/"],
};