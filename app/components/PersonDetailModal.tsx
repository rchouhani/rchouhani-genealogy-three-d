"use client";

import { Person } from "../types/family";

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface PersonDetailModalProps {
  /** La personne dont on affiche les données. */
  person: Person;

  /**
   * Toutes les personnes de l'arbre. Nécessaire pour afficher un NOM
   * lisible ("Marie Dupont") pour chaque relation plutôt que son UUID brut,
   * qui est la seule info stockée dans person.relations[].targetId.
   */
  familyMembers: Person[];

  /** Ferme la modale sans rien déclencher (bouton × ou clic sur l'overlay). */
  onClose: () => void;

  /** Icône "Modifier" cliquée → page.tsx doit ouvrir EditPersonForm. */
  onEdit: () => void;

  /** Icône "Ajouter" cliquée → page.tsx doit ouvrir AddMemberForm avec cette personne pré-cochée. */
  onAddRelative: () => void;

  /** Icône "Supprimer" cliquée → page.tsx gère la confirmation + l'appel API. */
  onDelete: () => void;
}

// -----------------------------------------------------------------------------
// Composant
// -----------------------------------------------------------------------------

/**
 * Modale en LECTURE SEULE affichant les données d'une personne.
 *
 * Volontairement séparée de EditPersonForm : celle-ci ne fait aucun appel
 * API et ne modifie rien. Elle sert de point d'entrée : les 4 icônes du
 * bandeau du haut délèguent chacune à page.tsx, qui décide quoi ouvrir
 * ensuite (EditPersonForm, AddMemberForm, ou une confirmation de suppression).
 *
 * Comportement des actions non encore disponibles (Partager) : le bouton
 * est visible mais désactivé, pour indiquer que la fonctionnalité est prévue
 * (Phase 8/9 de la roadmap) sans donner l'impression d'un bouton cassé.
 */
export default function PersonDetailModal({
  person,
  familyMembers,
  onClose,
  onEdit,
  onAddRelative,
  onDelete,
}: PersonDetailModalProps) {
  // Formatage FR d'une date ISO ("1945-03-12" → "12/03/1945").
  // Retourne null si la date est absente, pour pouvoir masquer la ligne entière.
  const formatDate = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    // Garde-fou : si la string n'est pas une date valide, on l'affiche telle quelle
    // plutôt que de planter sur "Invalid Date".
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("fr-FR");
  };

  // Retrouve "Prénom Nom" à partir d'un id, pour la liste des relations.
  const getPersonLabel = (id: string) => {
    const p = familyMembers.find((m) => m.id === id);
    return p ? `${p.firstName} ${p.lastName}` : "Personne inconnue";
  };

  const birthDateLabel = formatDate(person.birthDate);
  const deathDateLabel = formatDate(person.deathDate);
  const isDeceased = Boolean(person.deathDate);

  return (
    // Overlay : un clic en dehors de la carte ferme la modale.
    <div
      className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center"
      onClick={onClose}
    >
      {/* stopPropagation : un clic À L'INTÉRIEUR de la carte ne doit pas la fermer. */}
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* -------------------------------------------------------------- */}
        {/* Bandeau d'actions — icônes Modifier / Ajouter / Supprimer / Partager */}
        {/* -------------------------------------------------------------- */}
        <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
          <div className="flex gap-1">
            {/* Modifier : ouvre EditPersonForm côté page.tsx */}
            <button
              type="button"
              onClick={onEdit}
              title="Modifier cette personne"
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              ✎
            </button>

            {/* Ajouter : ouvre AddMemberForm avec person pré-cochée comme référence */}
            <button
              type="button"
              onClick={onAddRelative}
              title="Ajouter un proche"
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              +
            </button>

            {/* Supprimer : la confirmation et l'appel API sont gérés par page.tsx,
                cette modale ne fait que déclencher l'intention. */}
            <button
              type="button"
              onClick={onDelete}
              title="Supprimer cette personne"
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500"
            >
              🗑
            </button>

            {/* Partager : désactivé volontairement, fonctionnalité prévue plus tard
                (Phase 9 — partage multi-utilisateurs de la roadmap). */}
            <button
              type="button"
              disabled
              title="Bientôt disponible"
              className="w-8 h-8 flex items-center justify-center rounded text-gray-300 dark:text-gray-600 cursor-not-allowed"
            >
              ↗
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Contenu — données en lecture seule                             */}
        {/* -------------------------------------------------------------- */}
        <div className="p-5">
          {/* Photo si renseignée, sinon rien (pas de placeholder imposé pour l'instant) */}
          {person.photoUrl && (
            <img
              src={person.photoUrl}
              alt={`${person.firstName} ${person.lastName}`}
              className="w-20 h-20 rounded-full object-cover mb-3 mx-auto"
            />
          )}

          <h2 className="text-lg font-semibold text-center dark:text-gray-100">
            {person.firstName} {person.lastName}
          </h2>

          {/* Nom de naissance affiché seulement s'il diffère du nom actuel */}
          {person.birthName && person.birthName !== person.lastName && (
            <p className="text-xs text-center text-gray-400 mb-2">
              Née {person.birthName}
            </p>
          )}

          <dl className="mt-4 flex flex-col gap-2 text-sm">
            {birthDateLabel && (
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Naissance</dt>
                <dd className="dark:text-gray-200">
                  {birthDateLabel}
                  {person.birthLocation ? ` — ${person.birthLocation}` : ""}
                </dd>
              </div>
            )}

            {/* Section décès affichée uniquement si la personne est décédée */}
            {isDeceased && (
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Décès</dt>
                <dd className="dark:text-gray-200">
                  {deathDateLabel}
                  {person.deathLocation ? ` — ${person.deathLocation}` : ""}
                </dd>
              </div>
            )}

            {/* Si aucune date n'est renseignée du tout */}
            {!birthDateLabel && !isDeceased && (
              <p className="text-xs text-gray-400 italic">
                Aucune date renseignée.
              </p>
            )}
          </dl>

          {/* Liste des relations, en lecture seule (la modification se fait
              uniquement depuis EditPersonForm, via l'icône Modifier ci-dessus). */}
          <div className="mt-4 pt-3 border-t dark:border-gray-600">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Relations ({person.relations.length})
            </h3>
            {person.relations.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Aucune relation enregistrée.</p>
            ) : (
              <ul className="text-sm flex flex-col gap-0.5">
                {person.relations.map((rel) => (
                  <li key={rel.id ?? rel.targetId} className="dark:text-gray-200">
                    {getPersonLabel(rel.targetId)}{" "}
                    <span className="text-xs text-gray-400">({rel.type})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
