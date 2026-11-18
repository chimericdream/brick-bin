import { addASet } from './add-a-set';
import { collectionValue } from './collection-value';
import { copiesAndBuildState } from './copies-and-build-state';
import { csvImport } from './csv-import';
import { firstRun } from './first-run';
import { importCatalog } from './import-catalog';
import { instructions } from './instructions';
import { kidProfile } from './kid-profile';
import { missingPieces } from './missing-pieces';
import type { Tutorial } from './types';
import { wishlist } from './wishlist';

/**
 * The tutorials, in order. To add one: write a file next to this one that exports a Tutorial, then
 * list it in a group below. Its number, step count, page, sidebar entry, pager and sitemap entry
 * all follow from that.
 */
export const TUTORIAL_GROUPS: { id: string; title: string; tutorials: Tutorial[] }[] = [
  { id: 'getting-going', title: 'Getting going', tutorials: [firstRun, importCatalog, addASet] },
  {
    id: 'day-to-day',
    title: 'Day to day',
    tutorials: [copiesAndBuildState, missingPieces, instructions],
  },
  { id: 'the-household', title: 'The household', tutorials: [kidProfile, wishlist] },
  { id: 'bigger-jobs', title: 'Bigger jobs', tutorials: [csvImport, collectionValue] },
];

export const TUTORIALS: Tutorial[] = TUTORIAL_GROUPS.flatMap((g) => g.tutorials);

/** 1-based position across all groups. */
export const tutorialNumber = (slug: string) => TUTORIALS.findIndex((t) => t.slug === slug) + 1;

export const tutorialBySlug = (slug: string) => TUTORIALS.find((t) => t.slug === slug);

export type { Tutorial } from './types';
