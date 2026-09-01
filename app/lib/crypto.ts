/**
 * @fileoverview Chiffrement applicatif des champs sensibles (AES-256-GCM).
 *
 * Pourquoi en plus du chiffrement Neon (disque + TLS) : le chiffrement au
 * repos de Neon protège contre un vol physique du disque ou une fuite au
 * niveau infrastructure, mais QUICONQUE dispose d'une connexion valide à
 * la base (toi via le SQL Editor, un identifiant compromis, une requête
 * mal protégée) voit les données en clair. Le chiffrement APPLICATIF
 * ajoute une couche : même avec un accès direct à la base, les valeurs
 * stockées sont illisibles sans la clé ENCRYPTION_KEY (qui ne vit QUE
 * dans les variables d'environnement du serveur applicatif, jamais en base).
 *
 * ⚠️ IMPLICATION CRITIQUE : si ENCRYPTION_KEY est perdue, TOUTES les
 * données chiffrées deviennent irrécupérables, définitivement — il n'y a
 * pas de "mot de passe oublié" pour du chiffrement symétrique. Sauvegarde
 * cette clé dans un gestionnaire de secrets séparé de ta base (jamais
 * dans le même endroit que les données qu'elle protège).
 *
 * Algorithme : AES-256-GCM (authenticated encryption) — chiffre ET
 * garantit l'intégrité (détecte toute donnée corrompue/modifiée).
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommandé pour GCM (96 bits)
const AUTH_TAG_LENGTH = 16;

/**
 * Clé de chiffrement, lue depuis l'environnement.
 * Doit faire exactement 32 octets (256 bits) une fois décodée en hex.
 * Génère-la avec : openssl rand -hex 32
 */
function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY manquante dans les variables d'environnement."
    );
  }
  const buffer = Buffer.from(key, "hex");
  if (buffer.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY doit faire 32 octets (64 caractères hex). Génère-en une avec: openssl rand -hex 32"
    );
  }
  return buffer;
}

/**
 * Chiffre une chaîne. Retourne une chaîne unique combinant IV + tag
 * d'authentification + texte chiffré, encodée en base64, séparée par ":".
 * C'est CETTE chaîne complète qui est stockée dans la colonne TEXT
 * existante — le type de colonne en base ne change pas.
 *
 * @param plaintext - Valeur en clair. `null`/`undefined` passent tels quels
 *                     (un champ optionnel absent reste absent, pas la peine
 *                     de chiffrer une absence de valeur).
 */
export function encryptField(plaintext: string | null | undefined): string | null | undefined {
  if (plaintext === null || plaintext === undefined) return plaintext;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

/**
 * Déchiffre une chaîne produite par encryptField.
 * Lève une erreur si le format est invalide ou si l'authentification
 * échoue (donnée corrompue ou clé incorrecte) — préférable à un retour
 * silencieux de données potentiellement fausses.
 */
export function decryptField(ciphertext: string | null | undefined): string | null | undefined {
  if (ciphertext === null || ciphertext === undefined) return ciphertext;

  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    // Donnée non chiffrée (ex. ligne créée avant l'activation du chiffrement) :
    // on la retourne telle quelle plutôt que de planter, pour ne pas bloquer
    // l'affichage de données historiques pendant la transition.
    return ciphertext;
  }

  const [ivB64, authTagB64, dataB64] = parts;

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivB64, "base64"),
    { authTagLength: AUTH_TAG_LENGTH }
  );
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Liste des champs de `persons` à chiffrer. Centralisée ici pour que
 * les routes API n'aient qu'à importer cette constante plutôt que de
 * lister les champs à la main à chaque endroit (source d'oubli sinon).
 */
export const ENCRYPTED_PERSON_FIELDS = [
  "firstName",
  "lastName",
  "birthName",
  "birthDate",
  "deathDate",
  "birthLocation",
  "deathLocation",
  "photoUrl",
] as const;

type EncryptablePerson = Partial<
  Record<(typeof ENCRYPTED_PERSON_FIELDS)[number], string | null | undefined>
>;

/**
 * Chiffre tous les champs sensibles présents dans l'objet fourni.
 * N'importe quel autre champ (id, generation, ownerId...) passe intact.
 * Utilisé avant chaque INSERT/UPDATE sur `persons`.
 */
export function encryptPersonFields<T extends EncryptablePerson>(data: T): T {
  const result = { ...data };
  for (const field of ENCRYPTED_PERSON_FIELDS) {
    if (field in result) {
      (result as Record<string, unknown>)[field] = encryptField(
        result[field] as string | null | undefined
      );
    }
  }
  return result;
}

/**
 * Déchiffre tous les champs sensibles d'une ligne (ou d'un tableau de lignes)
 * lue depuis la base. Utilisé après chaque SELECT sur `persons`.
 */
export function decryptPersonFields<T extends EncryptablePerson>(data: T): T {
  const result = { ...data };
  for (const field of ENCRYPTED_PERSON_FIELDS) {
    if (field in result) {
      (result as Record<string, unknown>)[field] = decryptField(
        result[field] as string | null | undefined
      );
    }
  }
  return result;
}
