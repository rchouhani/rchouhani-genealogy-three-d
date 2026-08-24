"use client";

import { useState, useEffect } from "react";
import TreeScene from "./components/TreeScene";
import SearchEngine from "./components/SearchEngine";
import AddMemberForm from "./components/AddMemberForm";
import FilterPanel from "./components/FilterPanel";
import { Person } from "./types/family";
import { RelationFilters } from "./types/scene";
import { RelationType as GenRelationType } from "./utils/generation";
import {
  fetchFamilyData,
  createPerson,
  createRelation,
} from "./lib/api";

/**
 * Retourne le type de relation inverse.
 * Ex : "mother" → "child", "uncle" → "nephew", etc.
 */
function getInverseRelationType(type: GenRelationType): GenRelationType {
  const inverseMap: Partial<Record<GenRelationType, GenRelationType>> = {
    parent: "child",
    mother: "child",
    father: "child",
    child: "parent",
    son: "parent",
    daughter: "parent",
    sibling: "sibling",
    brother: "sibling",
    sister: "sibling",
    spouse: "spouse",
    wife: "husband",
    husband: "wife",
    uncle: "nephew",
    aunt: "niece",
    nephew: "uncle",
    niece: "aunt",
    cousin: "cousin",
    grandParent: "grandChild",
    grandFather: "grandChild",
    grandMother: "grandChild",
    grandChild: "grandParent",
    stepFather: "child",
    stepMother: "child",
    stepBrother: "sibling",
    stepSister: "sibling",
    brotherInLaw: "sisterInLaw",
    sisterInLaw: "brotherInLaw",
    sonInLaw: "parent",
    daughterInLaw: "parent",
  };
  
  return inverseMap[type] || type;
}

export default function Page() {
  /** Source de vérité : données chargées depuis l'API. */
  const [familyData, setFamilyData] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  /** État de chargement initial. */
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  /** Filtres de relations actifs. */
  const [activeFilters, setActiveFilters] = useState<RelationFilters>({
    proches: true,
    elargie: false,
    recomposee: false,
    parAlliance: false,
    intergenerationnel: false,
  });

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
    // Plus de mapping nécessaire : on utilise directement relationType
    const isFirstMember = !relationTargetId;
    const storedType = relationType; // Type détaillé stocké directement

    try {
      // 1. Créer la personne en base
      const created = await createPerson(newMember);

      // 2. Créer les deux sens de la relation (sauf si premier membre)
      if (!isFirstMember) {
        const inverseType = getInverseRelationType(storedType);
        await Promise.all([
          createRelation(created.id, relationTargetId, storedType),
          createRelation(relationTargetId, created.id, inverseType),
        ]);
      }

      // 3. Construire l'objet Person complet pour l'état local
      const inverseType = getInverseRelationType(storedType);

      const member: Person = {
        id: created.id,
        firstName: created.firstName,
        lastName: created.lastName,
        generation: created.generation,
        relations: isFirstMember
          ? []
          : [{ targetId: relationTargetId, type: storedType }],
      };

      // 4. Mettre à jour la personne de référence avec la relation inverse
      const updatedFamily = isFirstMember
        ? familyData
        : familyData.map((p) =>
            p.id === relationTargetId
              ? {
                  ...p,
                  relations: [
                    ...p.relations,
                    { targetId: created.id, type: inverseType },
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
          onAddMember={handleCreatePerson}
          filters={activeFilters}
        />
      </div>

      {/* === Panneau de filtres === */}
      {!isCreating && (
        <FilterPanel
          filters={activeFilters}
          onChange={setActiveFilters}
        />
      )}

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
