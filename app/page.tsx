"use client";

import TreeScene from "./components/TreeScene";
import { useState } from "react";
import { Person } from "./types/family";
import { createFamilyData } from "./lib/createFamilyData";
import SearchEngine from "./components/SearchEngine";

export default function Page() {
  const [familyData, setFamilyData] = useState<Person[]>(createFamilyData());
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // ➜ Ajout d'un nouveau membre
  const handleAddMember = (newMember: Omit<Person, "id">) => {
    const newId = familyData.length + 1;
    const member: Person = { id: newId, ...newMember };
    setFamilyData([...familyData, member]);
  };

  // ➜ Sélection dans le SearchEngine
  const handleSelectPerson = (person: Person) => {
    setSelectedPerson(person);
  };

  // ➜ Appui sur le bouton +
  const handleCreatePerson = () => {
    console.log("Ouverture du AddMemberForm…");
    // Ici tu ouvriras ton modal AddMemberForm
  };

  return (
    <main className="flex flex-col md:flex-row items-start justify-between gap-6">
      <div className="flex-1 relative">
  <SearchEngine
    persons={familyData}
    onSelectPerson={handleSelectPerson}
    onCreatePerson={handleCreatePerson}
  />

  <TreeScene selectedPerson={selectedPerson} />
</div>
    </main>
  );
}
