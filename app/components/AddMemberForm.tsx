"use client";

import { useState } from "react";
import { Person, Relation } from "../types/family";

interface AddMemberFormProps {
  familyMembers: Person[];
  onAddMember: (
    newMember: Omit<Person, "id">,
    relationTargetId?: number
  ) => void;
}

export default function AddMemberForm({
  familyMembers,
  onAddMember,
}: AddMemberFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [generation, setGeneration] = useState(1);
  const [relationType, setRelationType] = useState<Relation["type"]>("child");
  const [relationTargetId, setRelationTargetId] = useState<
    number | undefined
  >();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !relationTargetId) return;

    const newMember: Omit<Person, "id"> = {
      firstName,
      lastName,
      generation,
      relations: [
        {
          id: relationTargetId,
          type: relationType,
        },
      ],
    };
    onAddMember(newMember, relationTargetId);

    setFirstName("");
    setLastName("");
    setGeneration(1);
    setRelationType("child");
    setRelationTargetId(undefined);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 p-4 bg-gray-100 rounded-md w-64"
    >
      <input
        type="text"
        placeholder=" Prénom"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="border px-2 py-1 rounded"
        required
      />
      <input
        type="text"
        placeholder=" Nom"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="border px-2 py-1 rounded"
        required
      />
      <input
        type="number"
        placeholder="Génération"
        value={generation}
        min={0}
        onChange={(e) => setGeneration(Number(e.target.value))}
        className="border px-2 py-1 rounded"
        required
      />
      <select
      value={relationType}
      onChange={(e) => setRelationType(e.target.value as Relation["type"])}
      className="border px-2 py-1 rounded"
      >
        <option value="child">Enfant</option>
        <option value="parent">Parent</option>
        <option value="sibling">Frère / Soeur</option>
        <option value="spouse">Conjoint(e)</option>
      </select>
      <select
      value={relationTargetId}
      onChange={(e) => setRelationTargetId(Number(e.target.value))}
      className="border px-2 py-1 rounded"
      required
      >
        <option value="">Choisir la personne de référence</option>
        {familyMembers.map((member) => (
            <option key={member.id} value={member.id}>
                {member.firstName} {member.lastName} (Génération {member.generation})
            </option>
        ))}
      </select>
      <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">
        Ajouter
      </button>
    </form>
  );
}
