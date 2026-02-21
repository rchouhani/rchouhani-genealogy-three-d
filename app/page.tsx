"use client";

import { useState, useEffect } from "react";
import TreeScene from "./components/TreeScene";
import SearchEngine from "./components/SearchEngine";
import AddMemberForm from "./components/AddMemberForm";
import { Person, StoredRelationType } from "./types/family";
import { RelationType as GenRelationType } from "./utils/generation";
import {
  fetchFamilyData,
  createPerson,
  createRelation,
} from "./lib/api";

/**
 * Convertit un RelationType granulaire (UI) en StoredRelationType (base de données).
 */
function mapToStoredRelationType(r: GenRelationType): Person["relations"][number]["type"] {
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
    case "grandChild":
      return "child";
    case "grandParent":
    case "grandFather":
    case "grandMother":
      return "parent";
    default:
      return "sibling";
  }
}

export default function Page() {
  /** Source de vérité : données chargées depuis l'API. */
  const [familyData, setFamilyData] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  /** État de chargement initial. */
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Chargement initial depuis l'API
  // ---------------------------------------------------------------------------

  useEffect(() => {
    fetchFamilyData()
      .then((data) => {
        setFamilyData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Erreur chargement famille:", err);
        setLoadError("Impossible de charger les données. Vérifie ta connexion.");
        setIsLoading(false);
      });
  }, []);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSelectPerson = (person: Person) => {
    setSelectedPerson(person);
  };

  const handleCreatePerson = () => {
    setIsCreating(true);
  };

  /**
   * Ajoute un membre :
   *   1. Crée la personne en base via POST /api/persons.
   *   2. Crée la relation via POST /api/relations (bidirectionnel géré côté API).
   *   3. Met à jour l'état local sans recharger toute la liste.
   */
  const handleAddMember = async (
    newMember: Omit<Person, "id" | "relations">,
    relationTargetId: string,
    relationType: GenRelationType
  ) => {
    const storedType = mapToStoredRelationType(relationType);

    try {
      // 1. Créer la personne en base
      const created = await createPerson(newMember);

      // 2. Créer la relation bidirectionnelle
      await createRelation(created.id, relationTargetId, storedType);

      // 3. Construire l'objet Person complet pour l'état local
const member: Person = {
  id: created.id,
  firstName: created.firstName,
  lastName: created.lastName,
  generation: created.generation,
  relations: [{ targetId: relationTargetId, type: storedType as StoredRelationType }],
};

      // 4. Mettre à jour la personne de référence avec la relation inverse
      const inverseType = storedType === "parent" ? "child"
        : storedType === "child" ? "parent"
        : storedType;

const updatedFamily = familyData.map((p) =>
  p.id === relationTargetId
    ? {
        ...p,
        relations: [
          ...p.relations,
          { targetId: created.id, type: inverseType as StoredRelationType },
        ],
      }
    : p
);

      setFamilyData([...updatedFamily, member]);
      setSelectedPerson(member);
      setIsCreating(false);
    } catch (err) {
      console.error("Erreur ajout membre:", err);
      alert("Erreur lors de l'ajout. Réessaie.");
    }
  };

  // ---------------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <p className="text-white text-lg">Chargement de l'arbre...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <p className="text-red-400 text-lg">{loadError}</p>
      </div>
    );
  }

  return (
    <main className="relative w-full h-screen">
      {/* === Scène 3D — toujours montée === */}
      <div className="w-full h-full">
        <TreeScene
          familyData={familyData}
          selectedPerson={selectedPerson}
          onSelectPerson={setSelectedPerson}
        />
      </div>

      {/* === Moteur de recherche — affiché si >= 10 personnes === */}
      {familyData.length >= 10 && !isCreating && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-lg px-4">
          <SearchEngine
            persons={familyData}
            onSelectPerson={handleSelectPerson}
            onCreatePerson={handleCreatePerson}
          />
        </div>
      )}

      {/* === Bouton "+" toujours visible === */}
      {!isCreating && (
        <button
          onClick={handleCreatePerson}
          className="absolute bottom-24 right-6 z-20 bg-blue-600 text-white
                     w-10 h-10 rounded-full shadow-lg hover:bg-blue-700
                     text-xl flex items-center justify-center"
          title="Ajouter un membre"
        >
          +
        </button>
      )}

      {/* === Formulaire d'ajout === */}
      {isCreating && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Ajouter un membre</h2>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            <AddMemberForm
              familyMembers={familyData}
              onAddMember={handleAddMember}
            />
          </div>
        </div>
      )}
    </main>
  );
}
