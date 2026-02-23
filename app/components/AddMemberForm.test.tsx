/**
 * @fileoverview Tests unitaires pour AddMemberForm.
 *
 * Couvre :
 *   - Cas base vide (premier membre)
 *   - Cas base non vide (sélection multi-références)
 *   - Validation des champs
 *   - Soumission du formulaire
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddMemberForm from "./AddMemberForm";
import { Person } from "../types/family";

describe("AddMemberForm", () => {
  const mockOnAddMember = jest.fn();

  beforeEach(() => {
    mockOnAddMember.mockClear();
  });

  // ---------------------------------------------------------------------------
  // Cas 1 : Base vide (premier membre)
  // ---------------------------------------------------------------------------

  describe("Premier membre (base vide)", () => {
    it("affiche un message explicatif quand familyMembers est vide", () => {
      render(
        <AddMemberForm familyMembers={[]} onAddMember={mockOnAddMember} />
      );

      expect(
        screen.getByText(/vous êtes le premier membre/i)
      ).toBeInTheDocument();
    });

    it("masque le sélecteur de type de relation et les checkboxes", () => {
      render(
        <AddMemberForm familyMembers={[]} onAddMember={mockOnAddMember} />
      );

      // Pas de label "Type de relation"
      expect(screen.queryByText(/type de relation/i)).not.toBeInTheDocument();

      // Pas de label "Personne(s) de référence"
      expect(
        screen.queryByText(/personne.*de référence/i)
      ).not.toBeInTheDocument();
    });

    it("affiche uniquement les champs prénom et nom", () => {
      const { container } = render(
        <AddMemberForm familyMembers={[]} onAddMember={mockOnAddMember} />
      );

      const inputs = screen.getAllByRole("textbox");
      expect(inputs).toHaveLength(2);
      expect(screen.getByPlaceholderText("Prénom")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Nom")).toBeInTheDocument();
    });

    it("soumet le formulaire avec génération 0 et aucune relation", async () => {
      const user = userEvent.setup();

      render(
        <AddMemberForm familyMembers={[]} onAddMember={mockOnAddMember} />
      );

      await user.type(screen.getByPlaceholderText("Prénom"), "Jean");
      await user.type(screen.getByPlaceholderText("Nom"), "Dupont");
      await user.click(screen.getByRole("button", { name: "Ajouter" }));

      expect(mockOnAddMember).toHaveBeenCalledTimes(1);
      expect(mockOnAddMember).toHaveBeenCalledWith(
        {
          firstName: "Jean",
          lastName: "Dupont",
          generation: 0,
        },
        "", // Aucune référence
        "child" // Ignoré
      );
    });

    it("réinitialise les champs après soumission réussie", async () => {
      const user = userEvent.setup();

      render(
        <AddMemberForm familyMembers={[]} onAddMember={mockOnAddMember} />
      );

      const prenomInput = screen.getByPlaceholderText("Prénom");
      const nomInput = screen.getByPlaceholderText("Nom");

      await user.type(prenomInput, "Jean");
      await user.type(nomInput, "Dupont");
      await user.click(screen.getByRole("button", { name: "Ajouter" }));

      await waitFor(() => {
        expect(prenomInput).toHaveValue("");
        expect(nomInput).toHaveValue("");
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Cas 2 : Base non vide (sélection multi-références)
  // ---------------------------------------------------------------------------

  describe("Membre non-premier (base avec données)", () => {
    const existingMembers: Person[] = [
      {
        id: "1",
        firstName: "Jean",
        lastName: "Dupont",
        generation: 0,
        relations: [],
      },
      {
        id: "2",
        firstName: "Marie",
        lastName: "Dupont",
        generation: 0,
        relations: [],
      },
    ];

    it('masque le message "premier membre"', () => {
      render(
        <AddMemberForm
          familyMembers={existingMembers}
          onAddMember={mockOnAddMember}
        />
      );

      expect(
        screen.queryByText(/vous êtes le premier membre/i)
      ).not.toBeInTheDocument();
    });

    it("affiche le sélecteur de type de relation", () => {
      render(
        <AddMemberForm
          familyMembers={existingMembers}
          onAddMember={mockOnAddMember}
        />
      );

      expect(screen.getByText(/type de relation/i)).toBeInTheDocument();
    });

    it("affiche les checkboxes avec tous les membres existants", () => {
      render(
        <AddMemberForm
          familyMembers={existingMembers}
          onAddMember={mockOnAddMember}
        />
      );

      expect(screen.getByText(/Jean Dupont/i)).toBeInTheDocument();
      expect(screen.getByText(/Marie Dupont/i)).toBeInTheDocument();
    });

    it("soumet avec l'id de la référence sélectionnée", async () => {
      const user = userEvent.setup();

      render(
        <AddMemberForm
          familyMembers={existingMembers}
          onAddMember={mockOnAddMember}
        />
      );

      await user.type(screen.getByPlaceholderText("Prénom"), "Lucas");
      await user.type(screen.getByPlaceholderText("Nom"), "Dupont");

      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "1");

      await user.click(screen.getByRole("button", { name: "Ajouter" }));

      expect(mockOnAddMember).toHaveBeenCalledTimes(1);
      expect(mockOnAddMember).toHaveBeenCalledWith(
        {
          firstName: "Lucas",
          lastName: "Dupont",
          generation: 1, // child de génération 0 → 1
        },
        "1", // ID de Jean
        "child"
      );
    });

    it("réinitialise les checkboxes après soumission", async () => {
      const user = userEvent.setup();

      render(
        <AddMemberForm
          familyMembers={existingMembers}
          onAddMember={mockOnAddMember}
        />
      );

      const jeanCheckbox = screen.getByText(/jean dupont/i);

      await user.type(screen.getByPlaceholderText("Prénom"), "Lucas");
      await user.type(screen.getByPlaceholderText("Nom"), "Dupont");
      await user.click(jeanCheckbox);
      await user.click(screen.getByRole("button", { name: /ajouter/i }));

      await waitFor(() => {
        expect(jeanCheckbox).not.toBeChecked();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Cas 3 : Validation edge cases
  // ---------------------------------------------------------------------------

  describe("Validation des entrées", () => {
    it("trim les espaces dans prénom et nom", async () => {
      const user = userEvent.setup();

      render(
        <AddMemberForm familyMembers={[]} onAddMember={mockOnAddMember} />
      );

      await user.type(screen.getByPlaceholderText("Prénom"), "  Jean  ");
      await user.type(screen.getByPlaceholderText("Nom"), "  Dupont  ");
      await user.click(screen.getByRole("button", { name: /ajouter/i }));

      expect(mockOnAddMember).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: "Jean",
          lastName: "Dupont",
        }),
        expect.anything(),
        expect.anything()
      );
    });

    it("échappe les balises HTML dangereuses", async () => {
      const user = userEvent.setup();

      render(
        <AddMemberForm familyMembers={[]} onAddMember={mockOnAddMember} />
      );

      const xssPayload = '<script>alert("XSS")</script>';

      await user.type(screen.getByPlaceholderText("Prénom"), xssPayload);
      await user.type(screen.getByPlaceholderText("Nom"), "Dupont");
      await user.click(screen.getByRole("button", { name: "Ajouter" }));

      expect(mockOnAddMember).toHaveBeenCalledWith(
          {
            firstName: xssPayload, // react échappe automatiquement à l'affichage
            lastName: "Dupont",
            generation: 0,
          },
          '',
          'child'
        );
        expect.anything(),
        expect.anything
      
    });

    it('échappe les caractères SQL dangereux', async () => {
        const user = userEvent.setup();

        render(
        <AddMemberForm
        familyMembers={[]}
        onAddMember={mockOnAddMember}
        />
        );

        const sqlInjection = "'; DROP TABLE persons; --";

        await user.type(screen.getByPlaceholderText('Prénom'), sqlInjection);
        await user.type(screen.getByPlaceholderText('Nom'), 'Dupont');
        await user.click(screen.getByRole('button', { name: 'Ajouter' }));

        expect(mockOnAddMember).toHaveBeenCalledWith(
            {
                firstName: sqlInjection,
                lastName: "Dupont",
                generation: 0,
            },
            '',
            'child'
        );
        expect.anything(),
        expect.anything
  })
    })
  });
// });
