"use client";

import { useState } from "react";
import { Person } from "../types/family";
import { RelationType as GenRelationType } from "../utils/generation";
import RelationSelector from "./RelationSelector";

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface EditPersonFormProps {
  /** La personne à modifier. Sert à pré-remplir tous les champs. */
  person: Person;

  /**
   * Toutes les personnes de l'arbre, y compris `person` elle-même.
   * Nécessaire pour :
   *   - proposer une liste de cibles quand on ajoute une nouvelle relation,
   *   - afficher le nom (et pas juste l'UUID) des relations déjà existantes.
   */
  familyMembers: Person[];

  /**
   * Appelé à la soumission du formulaire avec UNIQUEMENT les champs
   * d'identité/biographie (jamais les relations, gérées à part).
   * page.tsx transmet ça tel quel à PATCH /api/persons/:id.
   */
  onSave: (
    updates: Partial<
      Omit<Person, "id" | "relations" | "deathDate" | "deathLocation">
    > & {
      // deathDate/deathLocation sont exclus du Partial<Omit<...>> ci-dessus
      // puis redéfinis ici. Nécessaire car sinon TypeScript FUSIONNE les deux
      // déclarations (celle héritée de Person et celle-ci) par intersection :
      // `string | undefined` (héritée) & `string | null` (voulue) perd le
      // `null` au passage, ce qui provoquait l'erreur de type.
      // undefined = "ne pas toucher ce champ", null = "vider ce champ en base"
      // (cas où l'utilisateur décoche "décédé(e)").
      deathDate?: string | null;
      deathLocation?: string | null;
    }
  ) => void;

  /**
   * Appelé quand l'utilisateur supprime une relation existante.
   * On remonte l'objet Relation complet (pas juste son id) car page.tsx
   * a besoin du targetId pour retrouver et supprimer aussi la relation
   * inverse (stockée côté de l'autre personne).
   */
  onDeleteRelation: (relation: Person["relations"][number]) => void;

  /**
   * Appelé quand l'utilisateur ajoute une nouvelle relation depuis ce formulaire.
   * page.tsx se charge de créer les deux sens (direct + inverse) via l'API.
   */
  onAddRelation: (targetId: string, type: GenRelationType) => void;

  /** Appelé si l'utilisateur confirme la suppression de la personne entière. */
  onDeletePerson: () => void;

  /** Ferme le formulaire sans rien sauvegarder (bouton "Annuler" ou fond du modal). */
  onClose: () => void;
}

// -----------------------------------------------------------------------------
// Composant
// -----------------------------------------------------------------------------

/**
 * Formulaire de modification d'une personne déjà créée.
 *
 * Contrairement à AddMemberForm (création), ce formulaire :
 *   - pré-remplit tous les champs avec les valeurs actuelles de `person`,
 *   - sépare volontairement "infos biographiques" (un seul PATCH) et
 *     "relations" (DELETE/POST séparés), car ce sont deux tables différentes
 *     en base (persons vs relations) avec des routes différentes,
 *   - permet la suppression complète de la personne.
 */
export default function EditPersonForm({
  person,
  familyMembers,
  onSave,
  onDeleteRelation,
  onAddRelation,
  onDeletePerson,
  onClose,
}: EditPersonFormProps) {
  // ---------------------------------------------------------------------------
  // État local — pré-rempli avec les valeurs actuelles de `person`.
  // On utilise `?? ""` partout car les champs optionnels peuvent être
  // `undefined` (personne créée avant qu'on ne les renseigne).
  // ---------------------------------------------------------------------------

  const [firstName, setFirstName] = useState(person.firstName);
  const [lastName, setLastName] = useState(person.lastName);
  const [birthName, setBirthName] = useState(person.birthName ?? "");
  const [birthDate, setBirthDate] = useState(person.birthDate ?? "");
  const [birthLocation, setBirthLocation] = useState(person.birthLocation ?? "");
  const [deathLocation, setDeathLocation] = useState(person.deathLocation ?? "");
  const [photoUrl, setPhotoUrl] = useState(person.photoUrl ?? "");

  // Case "décédé(e)" séparée de la date elle-même : permet de cocher/décocher
  // sans perdre la date déjà saisie si l'utilisateur se trompe de case.
  const [isDeceased, setIsDeceased] = useState(Boolean(person.deathDate));
  const [deathDate, setDeathDate] = useState(person.deathDate ?? "");

  // État du mini-formulaire "ajouter une relation" (partie basse du formulaire).
  const [newRelationTargetId, setNewRelationTargetId] = useState("");
  const [newRelationType, setNewRelationType] = useState<GenRelationType>("child");

  // ---------------------------------------------------------------------------
  // Soumission — infos biographiques uniquement
  // ---------------------------------------------------------------------------

  const handleSubmit = (e: React.FormEvent) => {
    // Empêche le rechargement de page par défaut d'un <form>.
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      alert("Le prénom et le nom sont obligatoires.");
      return;
    }

    // On construit l'objet envoyé à PATCH /api/persons/:id.
    // Important : deathDate n'est inclus QUE si `isDeceased` est coché.
    // Si l'utilisateur décoche "décédé(e)", on envoie explicitement `null`
    // pour vider le champ en base (sinon PATCH ne toucherait pas la colonne
    // et une ancienne date resterait enregistrée alors qu'elle ne devrait
    // plus apparaître).
    onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthName: birthName.trim() || undefined,
      birthDate: birthDate || undefined,
      birthLocation: birthLocation.trim() || undefined,
      photoUrl: photoUrl.trim() || undefined,
      deathDate: isDeceased ? (deathDate || undefined) : null,
      deathLocation: isDeceased ? (deathLocation.trim() || undefined) : null,
    });
  };

  // ---------------------------------------------------------------------------
  // Ajout d'une nouvelle relation
  // ---------------------------------------------------------------------------

  const handleAddRelationClick = () => {
    if (!newRelationTargetId) {
      alert("Sélectionne une personne.");
      return;
    }
    onAddRelation(newRelationTargetId, newRelationType);
    // Reset du mini-formulaire après ajout.
    setNewRelationTargetId("");
    setNewRelationType("child");
  };

  // ---------------------------------------------------------------------------
  // Suppression de la personne (avec confirmation, action irréversible :
  // cascade sur toutes ses relations en base — voir schema.ts onDelete: "cascade").
  // ---------------------------------------------------------------------------

  const handleDeletePersonClick = () => {
    const confirmed = window.confirm(
      `Supprimer définitivement ${person.firstName} ${person.lastName} et toutes ses relations ? Cette action est irréversible.`
    );
    if (confirmed) onDeletePerson();
  };

  // Retrouve le nom affichable d'une personne cible à partir de son id,
  // pour l'affichage de la liste des relations existantes.
  const getPersonLabel = (id: string) => {
    const p = familyMembers.find((m) => m.id === id);
    return p ? `${p.firstName} ${p.lastName}` : "Personne inconnue";
  };

  return (
    // Overlay sombre cliquable pour fermer, comme le modal AddMemberForm.
    <div
      className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center"
      onClick={onClose}
    >
      {/* stopPropagation : empêche le clic à l'intérieur du modal de le fermer. */}
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold dark:text-gray-100">
            Modifier {person.firstName} {person.lastName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Formulaire infos biographiques                                */}
        {/* ------------------------------------------------------------- */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="flex-1 border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100"
              required
            />
            <input
              type="text"
              placeholder="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="flex-1 border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100"
              required
            />
          </div>

          <input
            type="text"
            placeholder="Nom de naissance (si différent)"
            value={birthName}
            onChange={(e) => setBirthName(e.target.value)}
            className="border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100"
          />

          <div className="flex gap-3">
            <label className="flex-1 flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
              Date de naissance
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100"
              />
            </label>
            <label className="flex-1 flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
              Lieu de naissance
              <input
                type="text"
                value={birthLocation}
                onChange={(e) => setBirthLocation(e.target.value)}
                className="border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100"
              />
            </label>
          </div>

          {/* Case à cocher qui révèle les champs "décès" — évite d'avoir
              des champs de mort visibles en permanence pour les vivants. */}
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={isDeceased}
              onChange={(e) => setIsDeceased(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            Cette personne est décédée
          </label>

          {isDeceased && (
            <div className="flex gap-3">
              <label className="flex-1 flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
                Date de décès
                <input
                  type="date"
                  value={deathDate}
                  onChange={(e) => setDeathDate(e.target.value)}
                  className="border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100"
                />
              </label>
              <label className="flex-1 flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
                Lieu de décès
                <input
                  type="text"
                  value={deathLocation}
                  onChange={(e) => setDeathLocation(e.target.value)}
                  className="border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100"
                />
              </label>
            </div>
          )}

          <input
            type="url"
            placeholder="URL de la photo (optionnel)"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            className="border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100"
          />

          <button
            type="submit"
            className="mt-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Enregistrer les modifications
          </button>
        </form>

        {/* ------------------------------------------------------------- */}
        {/* Relations existantes — modification "manuelle" si nécessaire  */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-6 pt-4 border-t dark:border-gray-600">
          <h3 className="text-sm font-semibold mb-2 dark:text-gray-100">
            Relations actuelles
          </h3>

          {person.relations.length === 0 && (
            <p className="text-xs text-gray-400">Aucune relation enregistrée.</p>
          )}

          <ul className="flex flex-col gap-1 mb-3">
            {person.relations.map((rel) => (
              // rel.id peut être absent en théorie (sécurité de type) ;
              // dans la pratique il vient toujours de fetchFamilyData donc rempli.
              <li
                key={rel.id ?? rel.targetId}
                className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded"
              >
                <span className="dark:text-gray-200">
                  {getPersonLabel(rel.targetId)}{" "}
                  <span className="text-xs text-gray-400">({rel.type})</span>
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteRelation(rel)}
                  className="text-red-500 hover:text-red-700 text-xs"
                  title="Supprimer cette relation"
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>

          {/* Mini-formulaire d'ajout d'une relation manquante ou corrective. */}
          <div className="flex flex-col gap-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ajouter ou corriger une relation
            </p>
            <select
              value={newRelationTargetId}
              onChange={(e) => setNewRelationTargetId(e.target.value)}
              className="border px-3 py-2 rounded text-sm dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">— Choisir une personne —</option>
              {familyMembers
                // On exclut la personne elle-même de la liste des cibles possibles.
                .filter((m) => m.id !== person.id)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
            </select>
            <RelationSelector value={newRelationType} onChange={setNewRelationType} />
            <button
              type="button"
              onClick={handleAddRelationClick}
              className="bg-gray-600 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-700 self-start"
            >
              Ajouter cette relation
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Zone dangereuse — suppression complète de la personne         */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-6 pt-4 border-t dark:border-gray-600">
          <button
            type="button"
            onClick={handleDeletePersonClick}
            className="text-red-600 text-sm hover:underline"
          >
            Supprimer cette personne de l'arbre
          </button>
        </div>
      </div>
    </div>
  );
}
