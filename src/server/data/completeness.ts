export type BuildState = 'sealed' | 'opened' | 'in_progress' | 'built' | 'disassembled' | 'mixed';

export const BUILD_STATES: readonly BuildState[] = [
  'sealed',
  'opened',
  'in_progress',
  'built',
  'disassembled',
  'mixed',
];

export type Completeness =
  | { kind: 'sealed' }
  | { kind: 'missing'; pieces: number }
  | { kind: 'complete'; checkedOn: string }
  | { kind: 'not_checked' };

/**
 * Completeness is derived, never stored (docs/PLAN.md section 4): sealed copies read "Sealed";
 * open missing-item rows read "Missing N pieces"; no open rows plus a check date reads "Complete";
 * anything else is "Not checked".
 */
export function completenessOf(copy: {
  buildState: BuildState;
  piecesCheckedOn: string | null;
  missingPieces: number;
}): Completeness {
  if (copy.buildState === 'sealed') return { kind: 'sealed' };
  if (copy.missingPieces > 0) return { kind: 'missing', pieces: copy.missingPieces };
  if (copy.piecesCheckedOn) return { kind: 'complete', checkedOn: copy.piecesCheckedOn };
  return { kind: 'not_checked' };
}
