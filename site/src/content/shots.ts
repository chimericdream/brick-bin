/**
 * Every screenshot on the site, by ID. A page uses one with `<Shot id="LND-01" />`; TypeScript
 * rejects an unknown ID. `pnpm --filter brick-bin-site placeholders` rewrites site/PLACEHOLDERS.md
 * from this file, so the list and the pages cannot drift apart.
 *
 * To add the real image, save it as public/screenshots/<file base>.<light|dark>.png (see
 * shotFileBase) and rebuild. One theme is enough; the site shows it in both and says which.
 */

export interface ShotSpec {
  /** The screen's name, shown on the placeholder label. Also gives the file name. */
  title: string;
  /** desktop 16:10, phone 9:19.5 (full screen), crop 4:5 (a tight phone crop). */
  shape: 'desktop' | 'phone' | 'crop';
  /** The theme to capture first if only one can be taken. */
  theme: 'light' | 'dark';
  screen: string;
  state: string;
  viewport: string;
  focus: string;
  /** Describes the picture for someone who cannot see it. Becomes the <img alt>. */
  alt: string;
  /** One sentence under the real image, about 80 characters at most. */
  caption: string;
}

export const SHOTS = {
  'LND-01': {
    title: 'Set detail page',
    shape: 'desktop',
    theme: 'light',
    screen: 'Set detail page.',
    state:
      'One polybag set with five copies: one sealed, one built, two disassembled (one of them missing 4 pieces) and one mixed.',
    viewport: 'Desktop, 1440 wide, light.',
    focus:
      'The copies list, each row with its own state and place. Crop to the set header and the list; leave out the page footer.',
    alt: 'The set detail page, showing one set with five copies listed beneath it, each with its own build state and place.',
    caption: 'One set, five copies, each with its own build state and place.',
  },
  'LND-02': {
    title: 'Shopping list, store-trip mode',
    shape: 'phone',
    theme: 'dark',
    screen: 'Shopping list in store-trip mode.',
    state: 'About twelve missing parts across three sets, grouped by part and color, three ticked.',
    viewport: 'Phone, 390 wide, dark.',
    focus: 'The part pictures and the large checkboxes. Full screen, no browser chrome.',
    alt: 'The shopping list on a phone in store-trip mode: missing parts with pictures and large checkboxes, three already checked.',
    caption: 'Store-trip mode: the shopping list as a checklist on your phone.',
  },
  'SET-01': {
    title: 'First visit: create the household',
    shape: 'desktop',
    theme: 'light',
    screen: 'First visit: "Set up your bin".',
    state:
      'Brand-new install. The form is filled in with a sample household name but not yet submitted.',
    viewport: 'Desktop, 1440 wide, light.',
    focus: 'The whole form. Center it and crop the empty margins.',
    alt: 'The first-visit screen: a form asking for a household name and the details of the admin account.',
    caption: 'The first visit: name the household and create the admin account.',
  },
  'T01-01': {
    title: 'First visit, on a phone',
    shape: 'phone',
    theme: 'light',
    screen: 'First visit: "Set up your bin".',
    state: 'Empty form on a new install.',
    viewport: 'Phone, 390 wide, light.',
    focus:
      'The four fields: household name, your name, email and password, then Create household. Full screen, no browser chrome.',
    alt: 'The first-visit form on a phone, asking for a household name, your name, an email and a password.',
    caption: 'The first visit, on a phone.',
  },
  'T01-02': {
    title: 'Library, before the first set',
    shape: 'desktop',
    theme: 'light',
    screen: 'Library.',
    state: 'Just after Create household. No sets yet.',
    viewport: 'Desktop, 1440 wide, light.',
    focus: 'The "No sets yet" message and its "Add your first set" link, with the sidebar.',
    alt: 'The library of a new household with no sets, a link to add the first one, and the sidebar.',
    caption: 'A new household, before its first set.',
  },
  'T02-01': {
    title: 'Catalog settings, before the first import',
    shape: 'desktop',
    theme: 'light',
    screen: 'Settings, Catalog.',
    state:
      'Fresh install. "Never imported", the 6 GB warning with free disk space, an empty paste box and a disabled "Check the page" button.',
    viewport: 'Desktop, 1440 wide, light.',
    focus: 'The "Never imported" heading and the paste box. Crop to the main column.',
    alt: 'The catalog settings page on a new install: a heading saying it was never imported, a note about the 6 GB download, an empty paste box and a disabled button.',
    caption: 'The Catalog page before the first import.',
  },
  'T02-02': {
    title: 'Catalog settings, files found',
    shape: 'desktop',
    theme: 'light',
    screen: 'Settings, Catalog.',
    state:
      'Page source pasted and checked. The "This will download" summary is showing, with the Import catalog button.',
    viewport: 'Desktop, 1440 wide, light.',
    focus:
      'The summary and the Import catalog button. Crop out the pasted source, which is long and dull.',
    alt: 'The catalog settings page after checking the pasted page: a summary of what the import will download, and an Import catalog button.',
    caption: 'After the check: what Brick Bin will download, and the Import catalog button.',
  },
  'T02-03': {
    title: 'Catalog import in progress',
    shape: 'desktop',
    theme: 'dark',
    screen: 'Settings, Catalog, during an import.',
    state: 'Import running, roughly 40% of the files done, part images downloading.',
    viewport: 'Desktop, 1440 wide, dark.',
    focus: 'The "Import running" line, the progress bar and the step label. Crop tight to it.',
    alt: 'The catalog page during an import, with a progress bar at about 40 percent and a label saying which file is downloading.',
    caption: 'An import under way.',
  },
  'T02-04': {
    title: 'Catalog search results',
    shape: 'phone',
    theme: 'light',
    screen: 'Add a set, "Look up a LEGO set".',
    state: 'A set number typed in, three catalog matches listed.',
    viewport: 'Phone, 390 wide, light.',
    focus: 'The search field and the first match. Full screen, no browser chrome.',
    alt: 'The add-a-set lookup on a phone, showing three catalog matches for a typed set number, each with its name, number, year and piece count.',
    caption: 'Catalog lookup, with the set you looked for.',
  },
  'T03-01': {
    title: 'Add a set, catalog lookup',
    shape: 'desktop',
    theme: 'light',
    screen: 'Add a set.',
    state:
      'A LEGO set picked from the lookup: the form is filled in and the "Linked to Rebrickable set" note is showing.',
    viewport: 'Desktop, 1440 wide, light.',
    focus: 'The lookup panel and the filled-in fields beneath it.',
    alt: 'The add-a-set form filled in from a catalog match, with a note saying it is linked to a Rebrickable set.',
    caption: 'A set picked from the catalog fills the form in for you.',
  },
  'T03-02': {
    title: 'Add a set, barcode scan',
    shape: 'phone',
    theme: 'dark',
    screen: 'Add a set, "Scan the barcode on the box".',
    state: 'Camera view with a box barcode in frame.',
    viewport: 'Phone, 390 wide, dark, in a browser that supports barcode scanning.',
    focus: 'The camera view and the barcode. Full screen, no browser chrome.',
    alt: 'The barcode scanner on a phone, pointed at the barcode on a set box.',
    caption: 'Scanning the barcode on a box.',
  },
  'T03-03': {
    title: 'Add a set, by hand',
    shape: 'desktop',
    theme: 'light',
    screen: 'Add a set.',
    state:
      'Filled in by hand for a set from another brand: new brand, set number, name and piece count.',
    viewport: 'Desktop, 1440 wide, light.',
    focus: 'The Brand field and the set fields beneath it.',
    alt: 'The add-a-set form filled in by hand for a set from another brand.',
    caption: 'Typing in a set from another brand.',
  },
  'T04-01': {
    title: 'Set page with three copies',
    shape: 'desktop',
    theme: 'light',
    screen: 'Set detail page, Copies.',
    state: 'One set, three copies with different owners, places and build states.',
    viewport: 'Desktop, 1440 wide, light.',
    focus: 'The Copies list. Crop to the set header and the three copies.',
    alt: 'A set with three copies, each with its own owner, place and build state.',
    caption: 'Three copies of one set, in three states.',
  },
  'T04-02': {
    title: 'Build-state menu, open',
    shape: 'crop',
    theme: 'light',
    screen: 'Set detail page, the build-state menu on one copy.',
    state: 'Menu open, Built checked.',
    viewport: 'Phone, 390 wide, light, cropped to 4:5.',
    focus: 'The six states, their hints and the check mark.',
    alt: 'The build-state menu open on a phone, listing six states with Built checked.',
    caption: 'The build-state menu.',
  },
  'T05-01': {
    title: 'Missing pieces, picking from the set',
    shape: 'desktop',
    theme: 'light',
    screen: 'A copy’s Missing pieces page, "Add missing pieces", Set parts tab.',
    state: 'The set’s parts listed with pictures, a quantity of 2 entered on one part.',
    viewport: 'Desktop, 1440 wide, light.',
    focus: 'The part pictures and the quantity control.',
    alt: 'The missing-piece picker showing the set’s parts with pictures and a quantity field.',
    caption: 'Picking a missing part from the set’s own inventory.',
  },
  'T05-02': {
    title: 'Store-trip mode, part-way through',
    shape: 'phone',
    theme: 'dark',
    screen: 'Shopping list, store-trip mode.',
    state:
      'Twelve parts, three ticked, the "3 of 12 ticked" bar and the Done button at the bottom.',
    viewport: 'Phone, 390 wide, dark.',
    focus: 'The checkboxes, the part pictures and the Done bar. Full screen, no browser chrome.',
    alt: 'The shopping list in store-trip mode on a phone, with large checkboxes and three parts ticked.',
    caption: 'Store-trip mode, part-way through a trip.',
  },
  'T05-03': {
    title: 'Shopping list, export',
    shape: 'crop',
    theme: 'light',
    screen: 'Shopping list, Export opened.',
    state: 'The three formats showing: BrickLink wanted list, Rebrickable parts list, plain CSV.',
    viewport: 'Phone, 390 wide, light, cropped to 4:5.',
    focus: 'The three export links.',
    alt: 'The shopping list’s export choices: a BrickLink wanted list, a Rebrickable parts list and a plain CSV file.',
    caption: 'The three export formats.',
  },
  'T06-01': {
    title: 'Set page, instructions',
    shape: 'desktop',
    theme: 'light',
    screen: 'Set detail page, Instructions.',
    state: 'One uploaded PDF and one saved link, with the three buttons to add more.',
    viewport: 'Desktop, 1440 wide, light.',
    focus: 'The two items and the Upload PDF, Add link and Save PDF from a link buttons.',
    alt: 'The instructions section of a set, listing a PDF and a link, with buttons to upload a PDF, add a link or save a PDF from a link.',
    caption: 'A set’s instructions: one PDF and one link.',
  },
  'T06-02': {
    title: 'Save a PDF from a link',
    shape: 'crop',
    theme: 'light',
    screen: 'Set detail page, "Save a PDF from a link" dialog.',
    state: 'A PDF address and a name typed in, the download under way.',
    viewport: 'Phone, 390 wide, light, cropped to 4:5.',
    focus: 'The address field and the progress bar.',
    alt: 'The dialog for saving a PDF from a web address, with the address filled in and a progress bar.',
    caption: 'Brick Bin downloading a PDF from a web address.',
  },
  'T07-01': {
    title: 'People, add a kid profile',
    shape: 'desktop',
    theme: 'light',
    screen: 'Settings, People, "Add a person".',
    state:
      'Name, email and password filled in, Role set to "Kid profile: read-only, own wishlist".',
    viewport: 'Desktop, 1440 wide, light.',
    focus: 'The Role choice.',
    alt: 'The add-a-person form with the kid profile role selected.',
    caption: 'Adding a kid profile.',
  },
  'T07-02': {
    title: 'Library, seen by a kid profile',
    shape: 'phone',
    theme: 'light',
    screen: 'Library, signed in as the kid profile.',
    state:
      'The same collection as T04-01, seen by the kid: no prices, no Shopping list tab, and one hidden set absent.',
    viewport: 'Phone, 390 wide, light.',
    focus:
      'The tab bar with only Library and Wishlist, and the set tiles. Full screen, no browser chrome.',
    alt: 'The library as a kid profile sees it on a phone, with only the Library and Wishlist tabs.',
    caption: 'The collection as a kid profile sees it.',
  },
  'T08-01': {
    title: 'Wishlist with a private mark',
    shape: 'phone',
    theme: 'light',
    screen: 'Wishlist, another person’s list.',
    state: 'Four wishes, one of them marked "I bought this" by the person viewing.',
    viewport: 'Phone, 390 wide, light.',
    focus: 'The marked wish and the note that only you can see it. Full screen, no browser chrome.',
    alt: 'A wishlist with one item privately marked as bought by the viewer.',
    caption: 'A wish privately marked "I bought this".',
  },
  'T08-02': {
    title: '"We got it" dialog',
    shape: 'crop',
    theme: 'light',
    screen: 'Wishlist, "We got" dialog.',
    state: 'Confirming a wish: Brand chosen, "Add a sealed copy" ticked.',
    viewport: 'Phone, 390 wide, light, cropped to 4:5.',
    focus: 'The two checkboxes and the Add to the collection button.',
    alt: 'The dialog that turns a wish into a set in the collection, with options to add a sealed copy and hide it from kid profiles.',
    caption: '"We got it" turns the wish into a set.',
  },
  'T09-01': {
    title: 'CSV import, choosing the columns',
    shape: 'desktop',
    theme: 'light',
    screen: 'Import.',
    state:
      'A spreadsheet chosen, File format set to "Other CSV (choose the columns)", columns matched.',
    viewport: 'Desktop, 1440 wide, light.',
    focus: 'The column choices.',
    alt: 'The CSV import screen matching a spreadsheet’s columns to Brick Bin’s fields.',
    caption: 'Matching spreadsheet columns to Brick Bin fields.',
  },
  'T09-02': {
    title: 'CSV import, preview',
    shape: 'desktop',
    theme: 'light',
    screen: 'Import, Preview.',
    state: 'Forty rows ready, two with a problem.',
    viewport: 'Desktop, 1440 wide, light.',
    focus: 'The preview table, the two rows with a problem, and the Import button.',
    alt: 'The import preview: a table of rows saying what will happen to each, with two rows showing a problem.',
    caption: 'The preview, before anything is saved.',
  },
  'T10-01': {
    title: 'Collection and value',
    shape: 'desktop',
    theme: 'dark',
    screen: 'Collection.',
    state:
      'A few dozen copies: paid, estimated value and difference, the breakdowns, and three values not set in over a year.',
    viewport: 'Desktop, 1440 wide, dark.',
    focus: 'The Paid, Estimated value and Difference totals side by side.',
    alt: 'The collection page with totals for paid and estimated value, breakdowns by brand and theme, and a list of values that need updating.',
    caption: 'Paid against estimated value, with the values that need a fresh look.',
  },
} satisfies Record<string, ShotSpec>;

export type ShotId = keyof typeof SHOTS;

/** "LND-01" and "Set detail page" give "lnd-01-set-detail-page". Add ".light.png" or ".dark.png". */
export function shotFileBase(id: ShotId): string {
  const slug = SHOTS[id].title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${id.toLowerCase()}-${slug}`;
}
