"use client";

import { useState } from "react";
import TreeScene from "./components/TreeScene";
import SearchEngine from "./components/SearchEngine";
import AddMemberForm from "./components/AddMemberForm";
import { Person } from "./types/family";
import { createFamilyData } from "./lib/createFamilyData";

export default function Page() {
  const [familyData, setFamilyData] = useState<Person[]>(createFamilyData());
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showScene, setShowScene] = useState(false);

  // ➜ Sélection d'une personne depuis SearchEngine
  const handleSelectPerson = (person: Person) => {
    setSelectedPerson(person);
    setShowScene(true); // Affiche la scène après sélection
  };

  // ➜ Appui sur le bouton "+" du moteur de recherche
  const handleCreatePerson = () => {
    setIsCreating(true); // Ouvre le formulaire
  };

  // ➜ Ajout d'un membre depuis AddMemberForm
  const handleAddMember = (newMember: Omit<Person, "id">) => {
    const newId = familyData.length + 1;
    const member: Person = { id: newId, ...newMember };
    setFamilyData([...familyData, member]);
    setIsCreating(false); // Ferme le formulaire
    setShowScene(true);   // Affiche la scène
    setSelectedPerson(member); // Optionnel : sélectionne directement le nouveau membre
  };

  return (
    <main className="relative w-full h-screen flex justify-center items-center bg-gray-50">

      {/* === Affichage moteur de recherche === */}
      {!isCreating && !showScene && (
        <div className="z-20 w-full max-w-lg px-4">
          <SearchEngine
            persons={familyData}
            onSelectPerson={handleSelectPerson}
            onCreatePerson={handleCreatePerson}
          />
        </div>
      )}

      {/* === Formulaire AddMemberForm === */}
      {isCreating && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <AddMemberForm
              familyMembers={familyData}
              onAddMember={handleAddMember}
            />
          </div>
        </div>
      )}

      {/* === Scene 3D === */}
      {showScene && !isCreating && (
        <div className="w-full h-full">
          <TreeScene 
          selectedPerson={selectedPerson}
          familyData={familyData}
          />
        </div>
      )}

    </main>
  );
}
