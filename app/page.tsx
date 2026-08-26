"use client";

import { useState, useEffect } from "react";
import TreeScene from "./components/TreeScene";
import SearchEngine from "./components/SearchEngine";
import AddMemberForm from "./components/AddMemberForm";
import EditPersonForm from "./components/EditPersonForm";
import PersonDetailModal from "./components/PersonDetailModal";
import FilterPanel from "./components/FilterPanel";
import { Person } from "./types/family";
import { RelationFilters } from "./types/scene";
import { RelationType as GenRelationType } from "./utils/generation";
import {
  fetchFamilyData,
  createPerson,
  createRelation,
  updatePerson,
  deletePerson,
  deleteRelation,
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

  /**
   * Personne actuellement en cours d'édition (null = aucun formulaire ouvert).
   * Ouvert par un double-clic sur un point dans TreeScene (voir eventHandlers.ts).
   */
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  /**
   * Contrôle l'affichage de PersonDetailModal, indépendamment de selectedPerson.
   * Pourquoi séparé : selectedPerson pilote aussi le centrage caméra (voir
   * TreeScene) et doit donc pouvoir rester défini même quand l'utilisateur
   * ferme juste la modale (la caméra reste centrée, seule la fenêtre se ferme).
   */
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  /**
   * Id de la personne à pré-cocher dans AddMemberForm quand celui-ci est
   * ouvert depuis l'icône "Ajouter" de la modale de détails.
   * `undefined` = comportement normal (aucune référence pré-cochée).
   */
  const [addMemberPresetId, setAddMemberPresetId] = useState<string | undefined>(undefined);

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

  /**
   * Sélectionne une personne (clic sur un point, ou clic sur un résultat
   * de recherche) : centre la caméra dessus (géré par TreeScene via
   * selectedPerson) ET ouvre la modale de détails en lecture seule.
   */
  const handleSelectPerson = (person: Person) => {
    setSelectedPerson(person);
    setIsDetailModalOpen(true);
  };

  /**
   * Ouvre AddMemberForm sans référence pré-cochée — c'est le bouton "+"
   * générique du ControlsPanel, différent du "+" de PersonDetailModal
   * (celui-là passe par handleAddRelativeFromModal, qui définit un preset).
   */
  const handleCreatePerson = () => {
    setAddMemberPresetId(undefined);
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
  // Édition d'une personne existante
  // ---------------------------------------------------------------------------

  /**
   * Ouvre le formulaire d'édition. Déclenché par l'icône "Modifier" (✎)
   * de PersonDetailModal. On ferme la modale de détails au passage :
   * les deux fenêtres ne doivent jamais être ouvertes en même temps.
   */
  const handleEditPerson = (person: Person) => {
    setIsDetailModalOpen(false);
    setEditingPerson(person);
  };

  /**
   * Ouvre AddMemberForm avec `person` pré-cochée comme référence.
   * Déclenché par l'icône "Ajouter" (+) de PersonDetailModal.
   */
  const handleAddRelativeFromModal = (person: Person) => {
    setIsDetailModalOpen(false);
    setAddMemberPresetId(person.id);
    setIsCreating(true);
  };

  /**
   * Icône "Supprimer" de PersonDetailModal : demande confirmation puis
   * délègue à handleDeletePersonById (défini plus bas, logique partagée
   * avec EditPersonForm).
   */
  const handleDeleteFromModal = (person: Person) => {
    const confirmed = window.confirm(
      `Supprimer définitivement ${person.firstName} ${person.lastName} et toutes ses relations ? Cette action est irréversible.`
    );
    if (confirmed) handleDeletePersonById(person.id);
  };

  /**
   * Sauvegarde les champs biographiques (prénom, nom, dates, lieux, photo).
   *
   * Route backend utilisée : PATCH /api/persons/:id
   *   → met à jour uniquement les colonnes présentes dans `updates`,
   *     ne touche jamais à la table "relations".
   *
   * @param updates - Sous-ensemble des champs à modifier, tel que construit
   *                   par EditPersonForm.handleSubmit.
   */
  const handleSavePersonInfo = async (
    // Même correction que dans EditPersonForm.tsx : deathDate/deathLocation
    // sont exclus de l'Omit puis redéfinis avec `| null`, sinon TypeScript
    // fusionne par intersection et perd le `null`.
    updates: Partial<
      Omit<Person, "id" | "relations" | "deathDate" | "deathLocation">
    > & {
      deathDate?: string | null;
      deathLocation?: string | null;
    }
  ) => {
    if (!editingPerson) return;

    try {
      // Appel réseau : PATCH /api/persons/:id (voir api.ts → updatePerson).
      await updatePerson(editingPerson.id, updates);

      // Mise à jour optimiste de l'état local : on fusionne les nouveaux
      // champs sur la personne existante, sans attendre un rechargement
      // complet depuis l'API (plus réactif, et évite un aller-retour réseau
      // supplémentaire juste pour relire ce qu'on vient d'écrire).
      setFamilyData((prev) =>
        prev.map((p) =>
          p.id === editingPerson.id
            ? {
                ...p,
                ...updates,
                // `null` (venant du formulaire quand "décédé(e)" est décoché)
                // doit redevenir `undefined` côté état local, car le type
                // Person déclare ces champs comme `string | undefined`.
                deathDate: updates.deathDate === null ? undefined : updates.deathDate ?? p.deathDate,
                deathLocation: updates.deathLocation === null ? undefined : updates.deathLocation ?? p.deathLocation,
              }
            : p
        )
      );

      setEditingPerson(null);
    } catch (err) {
      console.error("Erreur mise à jour personne:", err);
      alert("Erreur lors de la mise à jour. Réessaie.");
    }
  };

  /**
   * Supprime UNE relation existante entre editingPerson et une autre personne.
   *
   * Rappel structurel : une relation visuelle = 2 lignes en base (une par sens).
   * `relation` ne porte que l'id d'UN sens (celui stocké sur editingPerson).
   * On doit donc :
   *   1. Retrouver la personne cible (relation.targetId),
   *   2. Retrouver SON entrée de relation qui pointe en retour vers editingPerson,
   *   3. Supprimer les deux lignes en base.
   *
   * Route backend utilisée : DELETE /api/relations/:id — appelée DEUX FOIS
   * (une fois par sens), car la route ne supprime qu'une ligne à la fois.
   */
  const handleDeleteRelationInEdit = async (
    relation: Person["relations"][number]
  ) => {
    if (!editingPerson || !relation.id) return;

    const target = familyData.find((p) => p.id === relation.targetId);
    // La relation inverse est celle, chez `target`, dont targetId pointe
    // vers editingPerson.id (peu importe son `type`, qui peut légitimement
    // différer : ex. editingPerson→target="uncle" et target→editingPerson="nephew").
    const inverseRelation = target?.relations.find(
      (r) => r.targetId === editingPerson.id
    );

    const confirmed = window.confirm(
      `Retirer le lien entre ${editingPerson.firstName} et ${target?.firstName ?? "cette personne"} ?`
    );
    if (!confirmed) return;

    try {
      // Suppression du sens editingPerson → target.
      await deleteRelation(relation.id);
      // Suppression du sens inverse, si on l'a trouvé et qu'il a un id
      // (il devrait toujours en avoir un puisqu'il vient de fetchFamilyData).
      if (inverseRelation?.id) {
        await deleteRelation(inverseRelation.id);
      }

      // Mise à jour locale : on retire la relation des deux côtés,
      // sans attendre un rechargement complet.
      setFamilyData((prev) =>
        prev.map((p) => {
          if (p.id === editingPerson.id) {
            return {
              ...p,
              relations: p.relations.filter((r) => r.id !== relation.id),
            };
          }
          if (p.id === relation.targetId && inverseRelation) {
            return {
              ...p,
              relations: p.relations.filter((r) => r.id !== inverseRelation.id),
            };
          }
          return p;
        })
      );

      // On garde le modal ouvert mais avec les données à jour :
      // editingPerson est un instantané figé au moment du double-clic,
      // il faut donc le resynchroniser manuellement.
      setEditingPerson((prev) =>
        prev
          ? { ...prev, relations: prev.relations.filter((r) => r.id !== relation.id) }
          : prev
      );
    } catch (err) {
      console.error("Erreur suppression relation:", err);
      alert("Erreur lors de la suppression de la relation. Réessaie.");
    }
  };

  /**
   * Ajoute une nouvelle relation entre editingPerson et une personne cible.
   *
   * Route backend utilisée : POST /api/relations — appelée DEUX FOIS
   * (une fois par sens), exactement comme dans handleAddMember.
   *
   * @param targetId - Personne à relier à editingPerson.
   * @param type     - Type de relation du point de vue d'editingPerson.
   */
  const handleAddRelationInEdit = async (
    targetId: string,
    type: GenRelationType
  ) => {
    if (!editingPerson) return;

    const inverseType = getInverseRelationType(type);

    try {
      await Promise.all([
        createRelation(editingPerson.id, targetId, type),
        createRelation(targetId, editingPerson.id, inverseType),
      ]);

      // Comme les deux POST ci-dessus ne renvoient pas l'id généré ici
      // (on ignore volontairement leur retour pour rester simple),
      // on recharge l'ensemble des données depuis l'API plutôt que
      // de reconstruire un id localement. C'est le seul endroit du fichier
      // qui recharge tout : nécessaire pour récupérer les vrais UUID
      // des deux nouvelles lignes "relations" (indispensables si
      // l'utilisateur veut les supprimer juste après).
      const refreshed = await fetchFamilyData();
      setFamilyData(refreshed);
      setEditingPerson(
        refreshed.find((p) => p.id === editingPerson.id) ?? null
      );
    } catch (err) {
      console.error("Erreur ajout relation:", err);
      alert("Erreur lors de l'ajout de la relation. Réessaie.");
    }
  };

  /**
   * Supprime définitivement une personne, quelle que soit la fenêtre
   * d'où l'action a été déclenchée (modale de détails OU EditPersonForm).
   * Centralisée ici pour ne pas dupliquer la logique de nettoyage de
   * l'état local à deux endroits différents.
   *
   * Route backend utilisée : DELETE /api/persons/:id
   *   → grâce à `onDelete: "cascade"` sur les clés étrangères de la table
   *     "relations" (voir schema.ts), TOUTES les lignes de relations
   *     impliquant cette personne (dans les deux sens) sont supprimées
   *     automatiquement par PostgreSQL. Le front n'a rien à faire de plus
   *     côté relations.
   *
   * @param id - UUID de la personne à supprimer.
   */
  const handleDeletePersonById = async (id: string) => {
    try {
      await deletePerson(id);

      // On retire la personne, ET on nettoie les relations des AUTRES
      // personnes qui pointaient vers elle (le cascade côté base ne se
      // reflète pas automatiquement dans l'état React local).
      setFamilyData((prev) =>
        prev
          .filter((p) => p.id !== id)
          .map((p) => ({
            ...p,
            relations: p.relations.filter((r) => r.targetId !== id),
          }))
      );

      // Referme toute fenêtre qui pointait vers cette personne.
      if (selectedPerson?.id === id) {
        setSelectedPerson(null);
        setIsDetailModalOpen(false);
      }
      if (editingPerson?.id === id) {
        setEditingPerson(null);
      }
    } catch (err) {
      console.error("Erreur suppression personne:", err);
      alert("Erreur lors de la suppression. Réessaie.");
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
          onSelectPerson={handleSelectPerson}
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
                onClick={() => {
                  setIsCreating(false);
                  // Reset systématique : évite qu'une ancienne référence
                  // pré-cochée réapparaisse au prochain "+" classique
                  // (celui du ControlsPanel, sans personne de départ).
                  setAddMemberPresetId(undefined);
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            <AddMemberForm
              familyMembers={familyData}
              onAddMember={handleAddMember}
              presetTargetId={addMemberPresetId}
            />
          </div>
        </div>
      )}

      {/* === Modale de détails — ouverte au clic sur un point === */}
      {isDetailModalOpen && selectedPerson && !isCreating && !editingPerson && (
        <PersonDetailModal
          person={selectedPerson}
          familyMembers={familyData}
          onClose={() => setIsDetailModalOpen(false)}
          onEdit={() => handleEditPerson(selectedPerson)}
          onAddRelative={() => handleAddRelativeFromModal(selectedPerson)}
          onDelete={() => handleDeleteFromModal(selectedPerson)}
        />
      )}

      {/* === Formulaire d'édition — ouvert depuis l'icône ✎ de la modale === */}
      {editingPerson && (
        <EditPersonForm
          person={editingPerson}
          familyMembers={familyData}
          onSave={handleSavePersonInfo}
          onDeleteRelation={handleDeleteRelationInEdit}
          onAddRelation={handleAddRelationInEdit}
          onDeletePerson={() => handleDeletePersonById(editingPerson.id)}
          onClose={() => setEditingPerson(null)}
        />
      )}
    </main>
  );
}
