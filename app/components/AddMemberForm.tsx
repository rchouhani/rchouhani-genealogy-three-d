"use client";

import { useState } from "react";
import { Person, Relation } from "../types/family";
import {
  RelationType as GenRelationType,
  computeGeneration,
} from "../utils/generation";
import RelationSelector from "./RelationSelector";

interface AddMemberFormProps {
  familyMembers: Person[];
  onAddMember: (
    newMember: Omit<Person, "id">,
    relationTargetId?: number
  ) => void;
}

function mapToStoredRelationType(r: GenRelationType): Relation["type"] {
  switch (r) {
    case "child":
    case "son":
    case "daughter":
      return "child";

    case "parent":
    case "mother":
    case "father":
    case "stepFather":
    case "stepMother":
      return "parent";

    case "spouse":
    case "husband":
    case "wife":
    case "sonInLaw":
    case "daughterInLaw":
    case "brotherInLaw":
    case "sisterInLaw":
      return "spouse";

    case "brother":
    case "sister":
    case "stepBrother":
    case "stepSister":
    case "cousin":
    case "uncle":
    case "aunt":
    case "nephew":
    case "niece":
      return "sibling";

    case "grandParent":
    case "grandFather":
    case "grandMother":
    case "grandChild":
      return r === "grandChild" ? "child" : "parent";

    default:
      return "sibling";
  }
}

export default function AddMemberForm({
  familyMembers,
  onAddMember,
}: AddMemberFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [relationType, setRelationType] = useState<GenRelationType>("child");
  const [relationTargetId, setRelationTargetId] = useState<number | "">("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || relationTargetId === "") {
      alert("il faut remplir au moins un champ");
      return;
    }

    const targetId = Number(relationTargetId);

    const target = familyMembers.find((m) => m.id === targetId);
    if (!target) {
      alert("Cible introuvable - changer de cible");
      return;
    }

    const generation = computeGeneration(target.generation, relationType);

    const storedType = mapToStoredRelationType(relationType);

    const newMember: Omit<Person, "id"> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      generation,
      relations: [
        {
          id: target.id,
          type: storedType,
        },
      ],
    };

    onAddMember(newMember, target.id);

    setFirstName("");
    setLastName("");
    setRelationType("child");
    setRelationTargetId("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 p-4 bg-white dark:bg-gray-800 rounded-md w-72 shadow"
    >
      <input
        type="text"
        placeholder="Prénom"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="border px-2 py-1 rounded dark:bg-gray-700 dark:text-gray-100"
        required
      />

      <input
        type="text"
        placeholder="Nom"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="border px-2 py-1 rounded dark:bg-gray-700 dark:text-gray-100"
        required
      />

      <label className="text-sm text-gray-600 dark:text-gray-300">
        Type de relation
      </label>
      
    <RelationSelector
    value={relationType}
    onChange={setRelationType}
    />

      <label className="text-sm text-gray-600 dark:text-gray-300">
        Personne de référence
      </label>
      <select
        value={relationTargetId}
        onChange={(e) =>
          setRelationTargetId(
            e.target.value === "" ? "" : Number(e.target.value)
          )
        }
        className="border px-2 py-1 rounded dark:bg-gray-700 dark:text-gray-100"
        required
      >
        <option value="">Choisir une personne</option>
        {familyMembers.map((member) => (
          <option key={member.id} value={member.id}>
            {member.firstName} {member.lastName} (Gén. {member.generation})
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
      >
        Ajouter
      </button>
    </form>
  );
}
