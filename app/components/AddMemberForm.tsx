"use client";

import { useState } from "react";
import { Person } from "../types/family";
import { RelationType as GenRelationType, computeGeneration } from "../utils/generation";
import RelationSelector from "./RelationSelector";

interface AddMemberFormProps {
  familyMembers: Person[];
  /**
   * @param newMember        - Prénom, nom, génération.
   * @param relationTargetId - ID de LA personne de référence, chaîne vide
   *                            si base vide (premier membre).
   * @param relationType     - Type de relation vis-à-vis de cette référence.
   */
  onAddMember: (
    newMember: Omit<Person, "id" | "relations">,
    relationTargetId: string,
    relationType: GenRelationType
  ) => void;
  /**
   * Optionnel : id d'une personne à présélectionner dans le <select> à
   * l'ouverture. Utilisé quand le formulaire est ouvert depuis l'icône
   * "Ajouter" (+) de PersonDetailModal — la personne consultée devient
   * la référence par défaut, l'utilisateur n'a plus qu'à choisir le type
   * de relation.
   */
  presetTargetId?: string;
}

/**
 * Formulaire d'ajout d'un membre.
 *
 * Deux modes :
 *   - Base vide     : prénom + nom uniquement, génération 0, sans relation.
 *   - Base non vide : prénom, nom, type de relation, et UNE personne de
 *     référence choisie via un <select> (pas de multi-sélection).
 */
export default function AddMemberForm({
  familyMembers,
  onAddMember,
  presetTargetId,
}: AddMemberFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [relationType, setRelationType] = useState<GenRelationType>("child");
  // Pré-rempli avec presetTargetId s'il est fourni, sinon vide comme avant
  // (l'utilisateur devra alors choisir manuellement dans le <select>).
  const [relationTargetId, setRelationTargetId] = useState<string>(
    presetTargetId ?? ""
  );
  const [error, setError] = useState("");

  const isFirstMember = familyMembers.length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("Le prénom et le nom sont obligatoires.");
      return;
    }

    // --- Cas base vide : premier membre, aucune relation possible ---
    if (isFirstMember) {
      onAddMember(
        { firstName: firstName.trim(), lastName: lastName.trim(), generation: 0 },
        "",
        "child"
      );
      setFirstName("");
      setLastName("");
      return;
    }

    // --- Cas base non vide : une référence est obligatoire ---
    if (!relationTargetId) {
      setError("Sélectionne une personne de référence.");
      return;
    }

    const reference = familyMembers.find((m) => m.id === relationTargetId);
    if (!reference) {
      setError("Personne de référence introuvable.");
      return;
    }

    const generation = computeGeneration(reference.generation, relationType);

    onAddMember(
      { firstName: firstName.trim(), lastName: lastName.trim(), generation },
      relationTargetId,
      relationType
    );

    setFirstName("");
    setLastName("");
    setRelationType("child");
    setRelationTargetId("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {isFirstMember && (
        <p className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded">
          Vous êtes le premier membre. Entrez simplement votre prénom et nom.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          {error}
        </p>
      )}

      <input
        type="text"
        placeholder="Prénom"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100"
        required
      />

      <input
        type="text"
        placeholder="Nom"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100"
        required
      />

      {/* Relation + référence — uniquement si base non vide */}
      {!isFirstMember && (
        <>
          <label className="text-sm text-gray-600 dark:text-gray-300">
            Type de relation
          </label>
          <RelationSelector value={relationType} onChange={setRelationType} />

          <label className="text-sm text-gray-600 dark:text-gray-300">
            Personne de référence
          </label>
          <select
            value={relationTargetId}
            onChange={(e) => setRelationTargetId(e.target.value)}
            className="border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">— Choisir une personne —</option>
            {familyMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.firstName} {member.lastName} (Gén. {member.generation})
              </option>
            ))}
          </select>
        </>
      )}

      <button
        type="submit"
        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Ajouter
      </button>
    </form>
  );
}
