"use client";

import { useState } from "react";
import { Person } from "../types/family";
import { RelationType as GenRelationType, computeGeneration } from "../utils/generation";
import RelationSelector from "./RelationSelector";

interface AddMemberFormProps {
  familyMembers: Person[];
  /**
   * Callback vers page.tsx.
   * Tout le calcul de l'ID, du type stocké, et de la relation inverse
   * est fait dans page.tsx. Ici on envoie juste les données brutes.
   *
   * @param newMember        - Prénom, nom, génération (sans ID, sans relations).
   * @param relationTargetId - ID de la personne de référence choisie.
   * @param relationType     - Type de relation détaillé choisi dans le sélecteur.
   */
  onAddMember: (
    newMember: Omit<Person, "id" | "relations">,
    relationTargetId: number,
    relationType: GenRelationType
  ) => void;
}

/**
 * Formulaire d'ajout d'un membre à la famille.
 *
 * Ce composant ne calcule rien de métier :
 *   - Pas de génération d'ID.
 *   - Pas de mapping de type de relation.
 *   - Pas de création de relation inverse.
 *
 * Il collecte les données de l'utilisateur et les remonte via onAddMember.
 */
export default function AddMemberForm({
  familyMembers,
  onAddMember,
}: AddMemberFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [relationType, setRelationType] = useState<GenRelationType>("child");
  const [relationTargetId, setRelationTargetId] = useState<number | "">("");

  /**
   * Validation et soumission du formulaire.
   * Vérifie que tous les champs sont remplis et que la cible existe
   * avant de remonter les données.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || relationTargetId === "") {
      alert("Tous les champs sont obligatoires.");
      return;
    }

    const targetId = Number(relationTargetId);
    const target = familyMembers.find((m) => m.id === targetId);

    if (!target) {
      alert("Personne de référence introuvable.");
      return;
    }

    // Génération calculée depuis la cible
    // (computeGeneration est utilisé ici car c'est une donnée de layout, pas de métier)
    const generation = computeGeneration(target.generation, relationType);

    // Remonter les données brutes vers page.tsx
    onAddMember(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        generation,
      },
      targetId,
      relationType
    );

    // Reset du formulaire
    setFirstName("");
    setLastName("");
    setRelationType("child");
    setRelationTargetId("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3"
    >
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

      {/* Type de relation */}
      <label className="text-sm text-gray-600 dark:text-gray-300">
        Type de relation
      </label>
      <RelationSelector value={relationType} onChange={setRelationType} />

      {/* Personne de référence */}
      <label className="text-sm text-gray-600 dark:text-gray-300">
        Personne de référence
      </label>
      <select
        value={relationTargetId}
        onChange={(e) =>
          setRelationTargetId(e.target.value === "" ? "" : Number(e.target.value))
        }
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

      {/* Bouton soumission */}
      <button
        type="submit"
        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Ajouter
      </button>
    </form>
  );
}
