"use client";

import { useState } from "react";
import { Person } from "../types/family";
import { RelationType as GenRelationType, computeGeneration } from "../utils/generation";
import RelationSelector from "./RelationSelector";

interface AddMemberFormProps {
  familyMembers: Person[];
  /**
   * Callback vers page.tsx.
   *
   * @param newMember        - Prénom, nom, génération (sans ID, sans relations).
   * @param relationTargetId - ID de la personne de référence. Vide si premier membre.
   * @param relationType     - Type de relation. Ignoré si premier membre.
   */
  onAddMember: (
    newMember: Omit<Person, "id" | "relations">,
    relationTargetId: string,
    relationType: GenRelationType
  ) => void;
}

/**
 * Formulaire d'ajout d'un membre à la famille.
 *
 * Deux modes :
 *   - Base vide (familyMembers.length === 0) :
 *       Seuls prénom et nom sont demandés.
 *       La personne est créée à la génération 0, sans relation.
 *       C'est le cas du premier utilisateur qui se crée lui-même.
 *
 *   - Base non vide :
 *       Prénom, nom, type de relation et personne de référence sont obligatoires.
 */
export default function AddMemberForm({
  familyMembers,
  onAddMember,
}: AddMemberFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [relationType, setRelationType] = useState<GenRelationType>("child");
  const [relationTargetId, setRelationTargetId] = useState<string>("");

  /** Premier membre : base actuellement vide. */
  const isFirstMember = familyMembers.length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      alert("Le prénom et le nom sont obligatoires.");
      return;
    }

    // --- Cas base vide : premier membre ---
    if (isFirstMember) {
      onAddMember(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          generation: 0,
        },
        "",         // pas de référence
        "child"     // ignoré dans page.tsx si relationTargetId est vide
      );

      setFirstName("");
      setLastName("");
      return;
    }

    // --- Cas base non vide : relation obligatoire ---
    if (!relationTargetId) {
      alert("Choisis une personne de référence.");
      return;
    }

    const target = familyMembers.find((m) => m.id === relationTargetId);
    if (!target) {
      alert("Personne de référence introuvable.");
      return;
    }

    const generation = computeGeneration(target.generation, relationType);

    onAddMember(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        generation,
      },
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

      {/* Message contextuel */}
      {isFirstMember && (
        <p className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded">
          Vous êtes le premier membre. Entrez simplement votre prénom et nom.
        </p>
      )}

      {/* Prénom */}
      <input
        type="text"
        placeholder="Prénom"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100"
        required
      />

      {/* Nom */}
      <input
        type="text"
        placeholder="Nom"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100"
        required
      />

      {/* Relation + Référence — uniquement si base non vide */}
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
            required
          >
            <option value="">Choisir une personne</option>
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
