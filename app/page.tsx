"use client";

import { useState } from "react";
import TreeScene from "./components/TreeScene";
import SearchEngine from "./components/SearchEngine";
import AddMemberForm from "./components/AddMemberForm";
import { Person } from "./types/family";
import { createFamilyData } from "./lib/createFamilyData";
import { computeGeneration } from "./utils/generation";
import { RelationType as GenRelationType } from "./utils/generation";

/**
 * Génère un ID unique basé sur le maximum des IDs existants.
 * Utilisé UNIQUEMENT ici. Aucun autre fichier ne génère d'ID.
 *
 * @param familyData - Liste actuelle des membres.
 * @returns Un ID unique supérieur à tous les IDs existants.
 */
function generateId(familyData: Person[]): number {
  if (familyData.length === 0) return 1;
  return Math.max(...familyData.map((p) => p.id)) + 1;
}

/**
 * Convertit un RelationType granulaire (UI) en StoredRelationType (base de données).
 * Ex : "mother" | "father" → "parent"
 *
 * @param r - Type de relation détaillé venu du RelationSelector.
 * @returns Le type de relation simplifié stocké sur Person.
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

    case "brother":
    case "sister":
    case "stepBrother":
    case "stepSister":
    case "cousin":
    case "uncle":
    case "aunt":
    case "nephew":
    case "niece":
    default:
      return "sibling";
  }
}

/**
 * Retourne le type de relation inverse.
 * Si A est "parent" de B, alors B est "child" de A.
 *
 * @param type - Type de relation original.
 * @returns Le type inverse correspondant.
 */
function getInverseRelationType(
  type: Person["relations"][number]["type"]
): Person["relations"][number]["type"] {
  switch (type) {
    case "parent":
      return "child";
    case "child":
      return "parent";
    case "spouse":
      return "spouse";   // Bidirectionnel identique
    case "sibling":
      return "sibling";  // Bidirectionnel identique
  }
}

export default function Page() {
  /** Source de vérité unique pour tous les membres de la famille. */
  const [familyData, setFamilyData] = useState<Person[]>(createFamilyData);

  /** Personne actuellement sélectionnée dans la scène 3D. */
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  /** Contrôle l'affichage du formulaire d'ajout. */
  const [isCreating, setIsCreating] = useState(false);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /**
   * Appelé depuis SearchEngine quand une personne est sélectionnée.
   */
  const handleSelectPerson = (person: Person) => {
    setSelectedPerson(person);
  };

  /**
   * Appelé depuis SearchEngine quand le bouton "+" est cliqué.
   */
  const handleCreatePerson = () => {
    setIsCreating(true);
  };

  /**
   * Appelé depuis AddMemberForm.
   * Responsabilités :
   *   1. Générer un ID unique.
   *   2. Créer le nouveau membre avec ses relations.
   *   3. Mettre à jour la personne de référence avec la relation inverse.
   *   4. Mettre à jour familyData (une seule mutation d'état).
   *
   * @param newMember        - Données du nouveau membre (sans ID).
   * @param relationTargetId - ID de la personne de référence.
   * @param relationType     - Type de relation détaillé venu du formulaire.
   */
  const handleAddMember = (
    newMember: Omit<Person, "id" | "relations">,
    relationTargetId: number,
    relationType: GenRelationType
  ) => {
    const newId = generateId(familyData);
    const storedType = mapToStoredRelationType(relationType);
    const inverseType = getInverseRelationType(storedType);

    // Le nouveau membre avec sa relation vers la cible
    const member: Person = {
      ...newMember,
      id: newId,
      relations: [{ targetId: relationTargetId, type: storedType }],
    };

    // Mise à jour de la personne de référence avec la relation inverse
    const updatedFamily = familyData.map((p) =>
      p.id === relationTargetId
        ? {
            ...p,
            relations: [...p.relations, { targetId: newId, type: inverseType }],
          }
        : p
    );

    // Une seule mise à jour d'état : nouveau membre + famille mise à jour
    setFamilyData([...updatedFamily, member]);
    setSelectedPerson(member);
    setIsCreating(false);
  };

  // ---------------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------------

  return (
    <main className="relative w-full h-screen">
      {/* === Scène 3D — toujours montée, jamais démontée === */}
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

      {/* === Bouton "+" visible toujours (ajout rapide) === */}
      {!isCreating && (
        <button
          onClick={handleCreatePerson}
          className="absolute bottom-24 right-6 z-20 bg-blue-600 text-white w-10 h-10 rounded-full shadow-lg hover:bg-blue-700 text-xl flex items-center justify-center"
        >
          +
        </button>
      )}

      {/* === Formulaire d'ajout — overlay === */}
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
