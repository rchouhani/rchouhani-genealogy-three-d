/**
 * Déclaration de type pour les imports CSS "bruts" (side-effect imports),
 * ex. `import './globals.css';` dans app/layout.tsx.
 *
 * TypeScript n'a par défaut aucune déclaration pour les fichiers .css :
 * ce n'est pas du JS/TS, donc `import './globals.css'` échoue la
 * vérification de types avec "Cannot find module" — même si Next.js
 * gère très bien ce fichier au moment du build réel (webpack/Turbopack).
 *
 * Cette ligne dit à TypeScript "traite n'importe quel import se terminant
 * par .css comme un module valide, sans typage précis (any)". C'est la
 * solution standard, propre, et pérenne — contrairement à un
 * `@ts-expect-error` au-dessus de chaque import CSS, qui doit être
 * répété partout et casse dès qu'une version de TS change son
 * comportement sur les directives "inutilisées" (ce qui vient de
 * provoquer l'erreur de build).
 */
declare module "*.css";