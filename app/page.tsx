"use client";

import { useState } from "react";
import TreeScene from "./components/TreeScene";
import SearchEngine from "./components/SearchEngine";
import { Person } from "./types/family";
import { createFamilyData } from "./lib/createFamilyData";

export default function Page() {
  const [familyData, setFamilyData] = useState<Person[]>(createFamilyData());
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Ajout d'un membre
  const handleAddMember = (newMember: Omit<Person, "id">) => {
    const newId = familyData.length + 1;
    const member: Person = { id: newId, ...newMember };
    setFamilyData([...familyData, member]);
  };

  // Sélection depuis SearchEngine
  const handleSelectPerson = (person: Person) => {
    setSelectedPerson(person);
  };

  // Ouverture du formulaire
  const handleCreatePerson = () => {
    console.log("Ouvrir AddMemberForm");
  };

  return (
    <main className="relative w-full h-screen flex items-center justify-center">
      
      {/* SearchEngine centré en toutes circonstances */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <SearchEngine
          persons={familyData}
          onSelectPerson={handleSelectPerson}
          onCreatePerson={handleCreatePerson}
        />
      </div>

      {/* Scène affichée UNIQUEMENT après sélection */}
      {selectedPerson && (
        <div className="absolute inset-0 z-10">
          <TreeScene selectedPerson={selectedPerson} />
        </div>
      )}
    </main>
  );
}
