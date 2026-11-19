'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Checkbox, NumberInput, Select, Tabs, TextInput, Textarea } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

import { Note } from '@/components/Note';
import { FigureImage, PartImage, Swatch } from '@/components/sets/PartImage';
import ui from '@/components/ui/ui.module.css';

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
    <section aria-labelledby="add-heading" className={`${ui.section} ${ui.stack}`}>
      <div className={ui.sectionHead}>
        <h2 id="add-heading">Add missing pieces</h2>
        <p className={ui.small}>
          Catalog data from <a href="https://rebrickable.com/">Rebrickable</a>
        </p>
      </div>

      <div aria-live="polite">
        {notice?.added && (
          <p role="status" className={classes.added}>
            Added {notice.added}.
          </p>
        )}
        {notice?.error && <Note variant="error">{notice.error}</Note>}
      </div>

      <div className={`${ui.panel} ${classes.picker}`}>
        <Tabs
          value={tab}
          onChange={setTab}
          keepMounted={false}
          classNames={{ list: classes.tabs, tab: classes.tab }}
        >
          <Tabs.List>
            {linked && <Tabs.Tab value="parts">Set parts</Tabs.Tab>}
            {linked && <Tabs.Tab value="minifigs">Minifigs</Tabs.Tab>}
            <Tabs.Tab value="catalog">Whole catalog</Tabs.Tab>
            <Tabs.Tab value="other">Other</Tabs.Tab>
          </Tabs.List>
          {linked && (
            <Tabs.Panel value="parts" className={classes.panel}>
              <InventoryTab copyId={copyId} add={add} busy={busy} setNum={setNum} />
            </Tabs.Panel>
          )}
          {linked && (
            <Tabs.Panel value="minifigs" className={classes.panel}>
              <MinifigsTab copyId={copyId} add={add} busy={busy} />
            </Tabs.Panel>
          )}
          <Tabs.Panel value="catalog" className={classes.panel}>
            <CatalogTab add={add} busy={busy} linked={linked} />
          </Tabs.Panel>
          <Tabs.Panel value="other" className={classes.panel}>
            <OtherTab add={add} busy={busy} />
          </Tabs.Panel>
        </Tabs>
      </div>
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
  /** One page of the inventory for the current filters. */
  const fetchPage = useCallback(
    async (offset: number): Promise<InvResponse> => {
      const p = new URLSearchParams({ offset: String(offset) });
      if (debounced) p.set('q', debounced);
      if (color) p.set('color', color);
      if (cat) p.set('cat', cat);
      if (spares) p.set('spares', '1');
      const res = await fetch(`/api/copies/${copyId}/inventory?${p}`);
      return (await res.json()) as InvResponse;
    },
    [copyId, debounced, color, cat, spares],
  );

  // A new set of filters replaces the grid. A slow answer for old filters is dropped.
  useEffect(() => {
    let live = true;
    fetchPage(0).then((json) => {
      if (!live) return;
      setData(json);
      setParts(json.parts ?? []);
    });
    return () => {
      live = false;
    };
  }, [fetchPage]);

  async function showMore() {
    setLoading(true);
    const json = await fetchPage(parts.length);
    setParts((prev) => [...prev, ...(json.parts ?? [])]);
    setLoading(false);
  }

  if (data && data.version === null) {
    return (
      <p className={ui.muted}>
        The catalog has no parts list for {setNum ?? 'this set'} yet. Use the Whole catalog tab to
        find a part.
      </p>
    );
  }

  return (
    <div className={ui.stack}>
      <div className={classes.filters}>
        <TextInput
          label="Search the set’s parts"
          placeholder="Part number, name or color"
          leftSection={<IconSearch size={20} stroke={1.75} />}
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          className={classes.grow}
        />
        <Select
          label="Color"
          placeholder="Any"
          clearable
          searchable
          data={(data?.colors ?? []).map((c) => ({
            value: String(c.id),
            label: `${c.name} (${c.n})`,
          }))}
          value={color}
          onChange={setColor}
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
        />
      </div>
      <Checkbox
        checked={spares}
        onChange={(e) => setSpares(e.currentTarget.checked)}
        label={`Show spare parts${data?.spareCount ? ` (${data.spareCount})` : ''}`}
      />
      <p className={ui.small} role="status">
        {data?.total === undefined
          ? 'Loading'
          : `${data.total} ${data.total === 1 ? 'part' : 'parts'}`}
        {data?.version ? ` · inventory version ${data.version}` : ''}
      </p>

      <ul className={`${ui.panel} ${ui.rows}`}>
        {parts.map((p) => {
          const key = `${p.partNum}-${p.colorId}-${p.isSpare}`;
          const n = qty[key] ?? 1;
          return (
            <li key={key} className={classes.line} data-act data-part={p.partNum}>
              <PartImage
                partNum={p.partNum}
                colorId={p.colorId}
                imageColorId={p.imageColorId}
                size={64}
              />
              <div className={classes.lineText}>
                <p className={classes.name}>{p.name}</p>
                <div className={classes.meta}>
                  <span className={classes.ink}>
                    <Swatch rgb={p.rgb} />
                    {p.colorName}
                  </span>
                  <span className="app-mono">#{p.partNum}</span>
                </div>
                <p className={classes.for}>
                  In the set: ×{p.quantity}
                  {p.isSpare && <span className={classes.spare}> spare</span>}
                </p>
                {p.imageColorId !== null && p.imageColorId !== p.colorId && (
                  <p className={ui.small}>Picture is in another color</p>
                )}
              </div>
              <div className={classes.actions}>
                <NumberInput
                  aria-label={`Quantity of ${p.name}, ${p.colorName}`}
                  min={1}
                  max={9999}
                  className={classes.qtyInput}
                  value={n}
                  onChange={(v) => setQty({ ...qty, [key]: Math.max(1, Number(v) || 1) })}
                />
                <Button
                  size="compact-md"
                  variant="default"
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
                {n > p.quantity && <span className={ui.small}>More than the set has</span>}
              </div>
            </li>
          );
        })}
      </ul>
      {data && data.total !== undefined && parts.length < data.total && (
        <Button variant="default" loading={loading} onClick={showMore} className={classes.more}>
          Show more
        </Button>
      )}
    </div>
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
  if (figs === null) return <p className={ui.muted}>Loading</p>;
  if (figs.length === 0)
    return <p className={ui.muted}>This set has no minifigures in the catalog.</p>;
  return (
    <ul className={`${ui.panel} ${ui.rows}`}>
      {figs.map((f) => (
        <li key={f.figNum} className={classes.line} data-act>
          <FigureImage size={64} />
          <div className={classes.lineText}>
            <p className={classes.name}>{f.name}</p>
            <div className={classes.meta}>
              <span className="app-mono">{f.figNum}</span>
            </div>
            <p className={classes.for}>In the set: ×{f.quantity}</p>
          </div>
          <div className={classes.actions}>
            <Button
              size="compact-md"
              variant="default"
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
    <div className={ui.stack}>
      <p className={ui.small}>
        {linked
          ? 'For a part that is not in the set’s own list.'
          : 'Search any LEGO part by number or name, then pick a color. Most off-brand parts follow the same shapes.'}
      </p>
      <TextInput
        label="Search parts"
        placeholder="3001 or Plate 1 x 2"
        leftSection={<IconSearch size={20} stroke={1.75} />}
        value={q}
        onChange={(e) => {
          setQ(e.currentTarget.value);
          setChosen(null);
          if (e.currentTarget.value.trim().length < 2) setHits([]);
        }}
      />
      {!chosen && hits.length > 0 && (
        <ul className={classes.hits} aria-label="Part matches">
          {hits.map((h) => (
            <li key={h.partNum}>
              <button type="button" className={classes.hit} onClick={() => choose(h)}>
                <b>{h.name}</b>
                <span className={classes.meta}>
                  <span className="app-mono">#{h.partNum}</span>
                  {h.categoryName ? ` · ${h.categoryName}` : ''}
                  {linked ? ' · Not in this set’s inventory' : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {chosen && (
        <div className={`${ui.panel} ${classes.chosen}`}>
          <PartImage
            partNum={chosen.partNum}
            colorId={Number(colorId || 0)}
            imageColorId={colors.length ? Number(colorId || 0) : null}
            size={88}
          />
          <div className={ui.stack}>
            <p className={classes.name}>
              {chosen.name} <span className={`${ui.muted} app-mono`}>#{chosen.partNum}</span>
            </p>
            {linked && <p className={ui.small}>Not in this set’s inventory</p>}
            <Select
              label="Color"
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
            <div className={ui.actions}>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function OtherTab({ add, busy }: { add: AddFn; busy: boolean }) {
  const [description, setDescription] = useState('');
  const [count, setCount] = useState<number | string>(1);
  return (
    <div className={`${ui.stack} ${classes.other}`}>
      <p className={ui.small}>
        For something the catalog does not have: an off-brand special part, a sticker sheet, a
        printed tile.
      </p>
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
        className={classes.fit}
        loading={busy}
        disabled={!description.trim()}
        onClick={async () => {
          const r = await add({ kind: 'other', description, quantity: Number(count) || 1 });
          if (r.ok) setDescription('');
        }}
      >
        Add to missing
      </Button>
    </div>
  );
}
