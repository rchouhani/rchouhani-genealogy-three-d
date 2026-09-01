/**
 * @fileoverview Configuration centrale NextAuth v5 (Auth.js).
 *
 * Changement de forme par rapport à v4 :
 *   - Un seul objet de config passé à NextAuth(), qui retourne directement
 *     { handlers, auth, signIn, signOut } — plus de authOptions séparé
 *     ni de getServerSession(authOptions) à traîner dans chaque route.
 *   - `auth()` (exporté ici) remplace getServerSession() partout dans
 *     le code : `const session = await auth();`
 *
 * usersTable/accountsTable/... passés explicitement à DrizzleAdapter :
 * règle définitivement le problème qu'on a eu où l'adaptateur devinait
 * des noms de table par convention (singulier/pluriel) au lieu d'utiliser
 * les tables réellement définies dans schema.ts.
 */

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/app/db";
import { users, accounts, sessions, verificationTokens } from "@/app/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],

  session: {
    strategy: "database",
  },

  callbacks: {
    /**
     * Par défaut, session.user ne contient que name/email/image.
     * On y ajoute id, indispensable pour filtrer par ownerId plus tard.
     */
    async session({ session, user }) {
      if (session.user) {
        (session.user as { id: string }).id = user.id;
      }
      return session;
    },
  },
});
