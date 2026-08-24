/**
 * @fileoverview Tests unitaires pour FilterPanel.
 *
 * Couvre :
 *   - Rendu des 5 checkboxes
 *   - "Mes proches" coché par défaut
 *   - Changement d'état quand on coche/décoche
 *   - Appel de onChange avec les bonnes valeurs
 *   - Affichage des labels corrects
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterPanel from './FilterPanel';
import { RelationFilters } from '../types/scene';

describe('FilterPanel', () => {
  const defaultFilters: RelationFilters = {
    proches: true,
    elargie: false,
    recomposee: false,
    parAlliance: false,
    intergenerationnel: false,
  };

  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  // ---------------------------------------------------------------------------
  // Rendu et labels
  // ---------------------------------------------------------------------------

  it('affiche le titre "Relations affichées"', () => {
    render(<FilterPanel filters={defaultFilters} onChange={mockOnChange} />);
    expect(screen.getByText(/relations affichées/i)).toBeInTheDocument();
  });

  it('affiche les 5 checkboxes avec les bons labels', () => {
    render(<FilterPanel filters={defaultFilters} onChange={mockOnChange} />);

    expect(screen.getByLabelText(/mes proches/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/famille élargie/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/famille recomposée/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/par alliance/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/intergénérationnel/i)).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // État par défaut
  // ---------------------------------------------------------------------------

  it('coche "Mes proches" par défaut', () => {
    render(<FilterPanel filters={defaultFilters} onChange={mockOnChange} />);
    expect(screen.getByLabelText(/mes proches/i)).toBeChecked();
  });

  it('ne coche pas les autres filtres par défaut', () => {
    render(<FilterPanel filters={defaultFilters} onChange={mockOnChange} />);

    expect(screen.getByLabelText(/famille élargie/i)).not.toBeChecked();
    expect(screen.getByLabelText(/famille recomposée/i)).not.toBeChecked();
    expect(screen.getByLabelText(/par alliance/i)).not.toBeChecked();
    expect(screen.getByLabelText(/intergénérationnel/i)).not.toBeChecked();
  });

  // ---------------------------------------------------------------------------
  // Interaction : cocher/décocher
  // ---------------------------------------------------------------------------

  it('appelle onChange quand on coche "Famille élargie"', async () => {
    const user = userEvent.setup();

    render(<FilterPanel filters={defaultFilters} onChange={mockOnChange} />);

    const checkbox = screen.getByLabelText(/famille élargie/i);
    await user.click(checkbox);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultFilters,
      elargie: true,
    });
  });

  it('appelle onChange quand on décoche "Mes proches"', async () => {
    const user = userEvent.setup();

    render(<FilterPanel filters={defaultFilters} onChange={mockOnChange} />);

    const checkbox = screen.getByLabelText(/mes proches/i);
    await user.click(checkbox);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultFilters,
      proches: false,
    });
  });

  it('permet de cocher plusieurs filtres', async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <FilterPanel filters={defaultFilters} onChange={mockOnChange} />
    );

    // Cocher "Par alliance"
    await user.click(screen.getByLabelText(/par alliance/i));
    expect(mockOnChange).toHaveBeenLastCalledWith({
      ...defaultFilters,
      parAlliance: true,
    });

    // Simuler que le parent met à jour filters
    const updatedFilters = { ...defaultFilters, parAlliance: true };
    mockOnChange.mockClear();

    // Re-render avec les nouveaux filtres
    rerender(<FilterPanel filters={updatedFilters} onChange={mockOnChange} />);

    // Cocher "Famille recomposée"
    await user.click(screen.getByLabelText(/famille recomposée/i));
    expect(mockOnChange).toHaveBeenCalledWith({
      ...updatedFilters,
      recomposee: true,
    });
  });

  // ---------------------------------------------------------------------------
  // Affichage conditionnel selon les filtres actifs
  // ---------------------------------------------------------------------------

  it('affiche toutes les checkboxes cochées selon les filtres passés', () => {
    const allFilters: RelationFilters = {
      proches: true,
      elargie: true,
      recomposee: true,
      parAlliance: true,
      intergenerationnel: true,
    };

    render(<FilterPanel filters={allFilters} onChange={mockOnChange} />);

    expect(screen.getByLabelText(/mes proches/i)).toBeChecked();
    expect(screen.getByLabelText(/famille élargie/i)).toBeChecked();
    expect(screen.getByLabelText(/famille recomposée/i)).toBeChecked();
    expect(screen.getByLabelText(/par alliance/i)).toBeChecked();
    expect(screen.getByLabelText(/intergénérationnel/i)).toBeChecked();
  });

  // ---------------------------------------------------------------------------
  // Style et accessibilité
  // ---------------------------------------------------------------------------

  it('utilise des labels accessibles (for/id) pour chaque checkbox', () => {
    render(<FilterPanel filters={defaultFilters} onChange={mockOnChange} />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(5);

    // Chaque checkbox doit avoir un label associé
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toHaveAccessibleName();
    });
  });
});
