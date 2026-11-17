'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

import { FigureImage, PartImage, Swatch } from '@/components/sets/PartImage';

import { addMissingAction, type MissingState } from './actions';
import classes from './Missing.module.css';

interface InvPart {
  partNum: string;
  name: string;
  categoryName: string | null;
  colorId: number;
  colorName: string;
  rgb: string;
  quantity: number;
  isSpare: boolean;
  imageColorId: number | null;
}

interface InvResponse {
  linked: boolean;
  version: number | null;
  versions: number[];
  total?: number;
  colors?: { id: number; name: string; rgb: string; n: number }[];
  categories?: { id: number; name: string; n: number }[];
  spareCount?: number;
  parts?: InvPart[];
  figs?: { figNum: string; name: string; quantity: number }[];
}

interface PartHit {
  partNum: string;
  name: string;
  categoryName: string | null;
}

interface ColorOption {
  id: number;
  name: string;
  rgb: string;
  known: boolean;
}

/** Debounces a value, so a search runs when typing pauses. */
function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function MissingPicker({
  copyId,
  setId,
  linked,
  setNum,
}: {
  copyId: string;
  setId: string;
  linked: boolean;
  setNum: string | null;
}) {
  const [tab, setTab] = useState<string | null>(linked ? 'parts' : 'catalog');
  const [notice, setNotice] = useState<MissingState | null>(null);
  const [busy, setBusy] = useState(false);

  const add = useCallback(
    async (input: Parameters<typeof addMissingAction>[2]) => {
      setBusy(true);
      setNotice(null);
      const result = await addMissingAction(copyId, setId, input);
      setBusy(false);
      setNotice(result);
      return result;
    },
    [copyId, setId],
  );

  return (
    <section aria-labelledby="add-heading" className={classes.section}>
      <Title order={2} id="add-heading" size="h3">
        Add missing pieces
      </Title>
      <Text size="sm" c="dimmed" mb="xs">
        Catalog data from <a href="https://rebrickable.com">Rebrickable</a>
      </Text>

      <div aria-live="polite">
        {notice?.added && (
          <Alert color="green" variant="light" role="status" mb="sm">
            Added {notice.added}.
          </Alert>
        )}
        {notice?.error && (
          <Alert color="red" variant="light" role="alert" mb="sm">
            {notice.error}
          </Alert>
        )}
      </div>

      <Paper withBorder p="md">
        <Tabs value={tab} onChange={setTab} keepMounted={false}>
          <Tabs.List>
            {linked && <Tabs.Tab value="parts">Set parts</Tabs.Tab>}
            {linked && <Tabs.Tab value="minifigs">Minifigs</Tabs.Tab>}
            <Tabs.Tab value="catalog">Whole catalog</Tabs.Tab>
            <Tabs.Tab value="other">Other</Tabs.Tab>
          </Tabs.List>
          {linked && (
            <Tabs.Panel value="parts" pt="md">
              <InventoryTab copyId={copyId} add={add} busy={busy} setNum={setNum} />
            </Tabs.Panel>
          )}
          {linked && (
            <Tabs.Panel value="minifigs" pt="md">
              <MinifigsTab copyId={copyId} add={add} busy={busy} />
            </Tabs.Panel>
          )}
          <Tabs.Panel value="catalog" pt="md">
            <CatalogTab add={add} busy={busy} linked={linked} />
          </Tabs.Panel>
          <Tabs.Panel value="other" pt="md">
            <OtherTab add={add} busy={busy} />
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </section>
  );
}

type AddFn = (input: Parameters<typeof addMissingAction>[2]) => Promise<MissingState>;

// ---------------------------------------------------------------------------

function InventoryTab({
  copyId,
  add,
  busy,
  setNum,
}: {
  copyId: string;
  add: AddFn;
  busy: boolean;
  setNum: string | null;
}) {
  const [q, setQ] = useState('');
  const [color, setColor] = useState<string | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const [spares, setSpares] = useState(false);
  const [data, setData] = useState<InvResponse | null>(null);
  const [parts, setParts] = useState<InvPart[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const debounced = useDebounced(q);
  const seq = useRef(0);

  const load = useCallback(
    async (offset: number) => {
      const mine = ++seq.current;
      setLoading(true);
      const p = new URLSearchParams({ offset: String(offset) });
      if (debounced) p.set('q', debounced);
      if (color) p.set('color', color);
      if (cat) p.set('cat', cat);
      if (spares) p.set('spares', '1');
      const res = await fetch(`/api/copies/${copyId}/inventory?${p}`);
      const json = (await res.json()) as InvResponse;
      if (mine !== seq.current) return;
      setData(json);
      setParts((prev) => (offset === 0 ? (json.parts ?? []) : [...prev, ...(json.parts ?? [])]));
      setLoading(false);
    },
    [copyId, debounced, color, cat, spares],
  );

  useEffect(() => {
    void load(0);
  }, [load]);

  if (data && data.version === null) {
    return (
      <Text c="dimmed">
        The catalog has no parts list for {setNum ?? 'this set'} yet. Use the Whole catalog tab to
        find a part.
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      <Group align="flex-end" gap="sm" wrap="wrap">
        <TextInput
          label="Search the set’s parts"
          placeholder="Part number, name or colour"
          leftSection={<IconSearch size={16} />}
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          style={{ flex: '1 1 220px' }}
        />
        <Select
          label="Colour"
          placeholder="Any"
          clearable
          searchable
          data={(data?.colors ?? []).map((c) => ({
            value: String(c.id),
            label: `${c.name} (${c.n})`,
          }))}
          value={color}
          onChange={setColor}
          style={{ flex: '1 1 160px' }}
        />
        <Select
          label="Category"
          placeholder="Any"
          clearable
          searchable
          data={(data?.categories ?? []).map((c) => ({
            value: String(c.id),
            label: `${c.name} (${c.n})`,
          }))}
          value={cat}
          onChange={setCat}
          style={{ flex: '1 1 160px' }}
        />
      </Group>
      <Checkbox
        checked={spares}
        onChange={(e) => setSpares(e.currentTarget.checked)}
        label={`Show spare parts${data?.spareCount ? ` (${data.spareCount})` : ''}`}
      />
      <Text size="sm" c="dimmed" role="status">
        {data?.total === undefined
          ? 'Loading'
          : `${data.total} ${data.total === 1 ? 'part' : 'parts'}`}
        {data?.version ? ` · inventory version ${data.version}` : ''}
      </Text>

      <ul className={classes.grid}>
        {parts.map((p) => {
          const key = `${p.partNum}-${p.colorId}-${p.isSpare}`;
          const n = qty[key] ?? 1;
          return (
            <li key={key} className={classes.tile} data-part={p.partNum}>
              <PartImage
                partNum={p.partNum}
                colorId={p.colorId}
                imageColorId={p.imageColorId}
                size={96}
              />
              <div className={classes.tileText}>
                <Text fw={650} lineClamp={2}>
                  {p.name}
                </Text>
                <div className={classes.sub}>
                  <span className={classes.colorLine}>
                    <Swatch rgb={p.rgb} />
                    {p.colorName}
                  </span>
                  <span>#{p.partNum}</span>
                </div>
                <Text size="sm">
                  In the set: ×{p.quantity}
                  {p.isSpare && <span className={classes.spare}> spare</span>}
                </Text>
                {p.imageColorId !== null && p.imageColorId !== p.colorId && (
                  <Text size="xs" c="dimmed">
                    Picture is in another colour
                  </Text>
                )}
              </div>
              <div className={classes.tileActions}>
                <NumberInput
                  aria-label={`Quantity of ${p.name}, ${p.colorName}`}
                  min={1}
                  max={9999}
                  size="xs"
                  w={70}
                  value={n}
                  onChange={(v) => setQty({ ...qty, [key]: Math.max(1, Number(v) || 1) })}
                />
                <Button
                  size="compact-md"
                  loading={busy}
                  onClick={() =>
                    add({
                      kind: 'part',
                      partNum: p.partNum,
                      colorId: p.colorId,
                      quantity: n,
                      fromInventory: true,
                    })
                  }
                  aria-label={`Add ${n} × ${p.name}, ${p.colorName}`}
                >
                  Add {n}
                </Button>
                {n > p.quantity && (
                  <Text size="xs" c="dimmed">
                    More than the set has
                  </Text>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {data && data.total !== undefined && parts.length < data.total && (
        <Button variant="default" loading={loading} onClick={() => load(parts.length)}>
          Show more
        </Button>
      )}
    </Stack>
  );
}

// ---------------------------------------------------------------------------

function MinifigsTab({ copyId, add, busy }: { copyId: string; add: AddFn; busy: boolean }) {
  const [figs, setFigs] = useState<NonNullable<InvResponse['figs']> | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/api/copies/${copyId}/inventory?tab=minifigs`)
      .then((r) => r.json())
      .then((j: InvResponse) => live && setFigs(j.figs ?? []));
    return () => {
      live = false;
    };
  }, [copyId]);
  if (figs === null) return <Text c="dimmed">Loading</Text>;
  if (figs.length === 0) return <Text c="dimmed">This set has no minifigures in the catalog.</Text>;
  return (
    <ul className={classes.grid}>
      {figs.map((f) => (
        <li key={f.figNum} className={classes.tile}>
          <FigureImage size={96} />
          <div className={classes.tileText}>
            <Text fw={650}>{f.name}</Text>
            <div className={classes.sub}>
              <span>{f.figNum}</span>
            </div>
            <Text size="sm">In the set: ×{f.quantity}</Text>
          </div>
          <div className={classes.tileActions}>
            <Button
              size="compact-md"
              loading={busy}
              onClick={() =>
                add({ kind: 'minifig', figNum: f.figNum, quantity: 1, fromInventory: true })
              }
              aria-label={`Add ${f.name}`}
            >
              Add 1
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------

function CatalogTab({ add, busy, linked }: { add: AddFn; busy: boolean; linked: boolean }) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<PartHit[]>([]);
  const [chosen, setChosen] = useState<PartHit | null>(null);
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [colorId, setColorId] = useState<string | null>(null);
  const [count, setCount] = useState<number | string>(1);
  const debounced = useDebounced(q);

  useEffect(() => {
    let live = true;
    if (debounced.trim().length < 2) {
      queueMicrotask(() => live && setHits([]));
      return () => {
        live = false;
      };
    }
    fetch(`/api/parts/search?q=${encodeURIComponent(debounced)}`)
      .then((r) => r.json())
      .then((j: { hits: PartHit[] }) => live && setHits(j.hits));
    return () => {
      live = false;
    };
  }, [debounced]);

  async function choose(part: PartHit) {
    setChosen(part);
    setColorId(null);
    const res = await fetch(`/api/parts/colors?part=${encodeURIComponent(part.partNum)}`);
    const json = (await res.json()) as { colors: ColorOption[] };
    setColors(json.colors);
    setColorId(String(json.colors.find((c) => c.known)?.id ?? ''));
  }

  const selected = colors.find((c) => String(c.id) === colorId);

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        {linked
          ? 'For a part that is not in the set’s own list.'
          : 'Search any LEGO part by number or name, then pick a colour. Most off-brand parts follow the same shapes.'}
      </Text>
      <TextInput
        label="Search parts"
        placeholder="3001 or Plate 1 x 2"
        leftSection={<IconSearch size={16} />}
        value={q}
        onChange={(e) => {
          setQ(e.currentTarget.value);
          setChosen(null);
        }}
      />
      {!chosen && hits.length > 0 && (
        <ul className={classes.hits} aria-label="Part matches">
          {hits.map((h) => (
            <li key={h.partNum}>
              <button type="button" className={classes.hit} onClick={() => choose(h)}>
                <strong>{h.name}</strong>
                <span className={classes.sub}>
                  #{h.partNum}
                  {h.categoryName ? ` · ${h.categoryName}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {chosen && (
        <Paper withBorder p="sm">
          <Group gap="md" align="flex-start" wrap="wrap">
            <PartImage
              partNum={chosen.partNum}
              colorId={Number(colorId || 0)}
              imageColorId={colors.length ? Number(colorId || 0) : null}
              size={96}
            />
            <Stack gap="xs" style={{ flex: '1 1 240px' }}>
              <Text fw={650}>
                {chosen.name}{' '}
                <Text span c="dimmed">
                  #{chosen.partNum}
                </Text>
              </Text>
              <Select
                label="Colour"
                searchable
                data={colors.map((c) => ({
                  value: String(c.id),
                  label: `${c.name}${c.known ? '' : ' (not seen in this part)'}`,
                }))}
                value={colorId}
                onChange={setColorId}
                leftSection={selected ? <Swatch rgb={selected.rgb} /> : undefined}
              />
              <NumberInput
                label="How many?"
                min={1}
                max={9999}
                value={count}
                onChange={setCount}
                w={120}
              />
              <Group>
                <Button
                  loading={busy}
                  disabled={!colorId}
                  onClick={() =>
                    add({
                      kind: 'part',
                      partNum: chosen.partNum,
                      colorId: Number(colorId),
                      quantity: Number(count) || 1,
                    })
                  }
                >
                  Add to missing
                </Button>
                <Button variant="default" onClick={() => setChosen(null)}>
                  Pick another
                </Button>
              </Group>
            </Stack>
          </Group>
        </Paper>
      )}
    </Stack>
  );
}

// ---------------------------------------------------------------------------

function OtherTab({ add, busy }: { add: AddFn; busy: boolean }) {
  const [description, setDescription] = useState('');
  const [count, setCount] = useState<number | string>(1);
  return (
    <Stack gap="sm" maw={520}>
      <Text size="sm" c="dimmed">
        For something the catalog does not have: an off-brand special part, a sticker sheet, a
        printed tile.
      </Text>
      <Textarea
        label="What is missing?"
        placeholder="Sticker sheet, printed tile 2 x 2"
        value={description}
        onChange={(e) => setDescription(e.currentTarget.value)}
        autosize
        minRows={2}
      />
      <NumberInput label="How many?" min={1} max={9999} value={count} onChange={setCount} w={120} />
      <Button
        w="fit-content"
        loading={busy}
        disabled={!description.trim()}
        onClick={async () => {
          const r = await add({ kind: 'other', description, quantity: Number(count) || 1 });
          if (r.ok) setDescription('');
        }}
      >
        Add to missing
      </Button>
    </Stack>
  );
}
