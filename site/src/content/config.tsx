import type { ReactNode } from 'react';

/**
 * Every environment variable on the Configuration page, in its group (SPEC 6.20). One row per
 * variable: add a row here and it appears in its table with its own link. Checked against
 * .env.example, docker-compose.prod.yml, deploy/docker-compose.yml, the Dockerfile and the app.
 */
export interface ConfigVar {
  name: string;
  purpose: ReactNode;
  /** A literal value (shown in mono), a short description, or a "you must set this" tag. */
  default: { code: string } | { text: string; wrap?: boolean } | { tag: 'Required' | 'Set it' };
  /**
   * A note under the purpose, for rows where the compose files don't simply pass the value from
   * .env. The Default column is always the app's own default; the note says what the compose
   * files do instead. Wording rule (from the designer, so every note reads the same):
   * - One or two short sentences, each ending in a period. No jokes.
   * - Name the files with these terms only: "the try-out compose file", "the Tailscale install",
   *   "both compose files" (or "the compose files").
   * - Say what the file does first, then what the reader should do, if anything.
   * - Literal values are <code>, as everywhere else. Contractions as on the rest of the site.
   * - A note that repeats on several rows is fine: rows are reached one at a time by their links.
   */
  compose?: ReactNode;
}

export interface ConfigGroup {
  id: string;
  title: string;
  intro?: ReactNode;
  vars: ConfigVar[];
}

export const CONFIG_GROUPS: ConfigGroup[] = [
  {
    id: 'must-set',
    title: 'The ones you must set',
    intro: (
      <>
        With either compose file, these are all most installs need. You don&apos;t set{' '}
        <a href="#DATABASE_URL">
          <code>DATABASE_URL</code>
        </a>
        : the compose files build it from <code>POSTGRES_PASSWORD</code>.
      </>
    ),
    vars: [
      {
        name: 'POSTGRES_PASSWORD',
        purpose:
          'Password for the app’s own Postgres. Both compose files refuse to start without it.',
        default: { tag: 'Set it' },
      },
      {
        name: 'TS_AUTHKEY',
        purpose: 'Tailscale auth key for the sidecar, in the Tailscale install.',
        default: { tag: 'Set it' },
        compose: 'The try-out compose file doesn’t use it.',
      },
    ],
  },
  {
    id: 'server',
    title: 'Server',
    vars: [
      {
        name: 'DATABASE_URL',
        purpose: 'Postgres connection string.',
        default: { text: 'Built for you', wrap: true },
        compose: (
          <>
            Both compose files build it from <code>POSTGRES_PASSWORD</code>. Set it yourself only
            when running Brick Bin without them.
          </>
        ),
      },
      {
        name: 'APP_PORT',
        purpose: 'Port the app is published on.',
        default: { code: '3000' },
        compose: (
          <>
            Only the try-out compose file reads it. The Tailscale install always publishes{' '}
            <code>3000</code>.
          </>
        ),
      },
      {
        name: 'COOKIE_SECURE',
        purpose: (
          <>
            Set <code>true</code> once the app is served over HTTPS.
          </>
        ),
        default: { code: 'false' },
        compose: (
          <>
            The Tailscale install sets it to <code>true</code> itself.
          </>
        ),
      },
      {
        name: 'DATA_DIR',
        purpose: 'Where covers, instruction PDFs and catalog files are kept.',
        default: { code: './data' },
        compose: (
          <>
            Both compose files keep it at <code>/data</code>, on the app-data volume.
          </>
        ),
      },
      {
        name: 'AUTO_MIGRATE',
        purpose: (
          <>
            <code>false</code> skips database migrations on start.
          </>
        ),
        default: { code: 'true' },
      },
      {
        name: 'APP_VERSION',
        purpose: 'Release label, sent in the catalog import’s User-Agent.',
        default: { code: '0.1' },
        compose: (
          <>
            Both compose files pass it on only when it&apos;s set. Otherwise the Tailscale install
            uses the commit its image was built from, and the try-out compose file uses{' '}
            <code>dev</code>.
          </>
        ),
      },
    ],
  },
  {
    id: 'storage',
    title: 'Storage and limits',
    vars: [
      {
        name: 'TRASH_RETENTION_DAYS',
        purpose: (
          <>
            Days a deleted item waits in the trash before it&apos;s deleted for good. <code>0</code>{' '}
            keeps it until an admin deletes it.
          </>
        ),
        default: { code: '30' },
      },
      {
        name: 'INSTRUCTIONS_MAX_MB',
        purpose: 'Largest PDF the app will store, in megabytes.',
        default: { code: '200' },
      },
    ],
  },
  {
    id: 'catalog',
    title: 'Catalog import',
    intro: (
      <>
        These control where the catalog import may download from. Catalog data comes from{' '}
        <a href="https://rebrickable.com/">Rebrickable</a>, and the defaults point there.
      </>
    ),
    vars: [
      {
        name: 'REBRICKABLE_PAGE_FETCH',
        purpose: (
          <>
            <code>true</code> lets the import fetch the downloads page itself. Otherwise an admin
            pastes the page&apos;s source.
          </>
        ),
        default: { code: 'false' },
      },
      {
        name: 'REBRICKABLE_DOWNLOADS_PAGE',
        purpose: (
          <>
            Address of the downloads page, <code>https://rebrickable.com/downloads/</code>.
          </>
        ),
        default: { text: 'Rebrickable’s page', wrap: true },
      },
      {
        name: 'REBRICKABLE_ALLOWED_ORIGINS',
        purpose: (
          <>
            Origins the import may download from, comma-separated. HTTPS only. By default{' '}
            <code>https://rebrickable.com</code> and <code>https://cdn.rebrickable.com</code>.
          </>
        ),
        default: { text: 'Rebrickable and its CDN', wrap: true },
      },
      {
        name: 'CATALOG_IMAGE_ORIGIN',
        purpose: (
          <>
            The only origin set covers are downloaded from, <code>https://cdn.rebrickable.com</code>
            .
          </>
        ),
        default: { text: 'Rebrickable’s CDN', wrap: true },
      },
    ],
  },
];

export const CONFIG_COUNT = CONFIG_GROUPS.reduce((n, g) => n + g.vars.length, 0);
