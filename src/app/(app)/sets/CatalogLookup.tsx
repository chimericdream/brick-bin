'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ActionIcon, Button, Modal, TextInput, UnstyledButton } from '@mantine/core';
import { IconBarcode, IconSearch } from '@tabler/icons-react';
import Link from 'next/link';

import { DialogFoot } from '@/components/DialogFoot';
import { toastFailed } from '@/components/feedback/toast';
import { Note } from '@/components/Note';
import ui from '@/components/ui/ui.module.css';

import classes from './CatalogLookup.module.css';

export interface CatalogHit {
  setNum: string;
  number: string;
  name: string;
  year: number | null;
  pieces: number | null;
  theme: string | null;
  /** Household members with this set on their wishlist. */
  wishers?: string[];
}

// BarcodeDetector is not in the TS DOM lib yet.
type Detector = { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
declare const BarcodeDetector: new (opts: { formats: string[] }) => Detector;

interface Props {
  catalogReady: boolean;
  canImport: boolean;
  onPick: (hit: CatalogHit) => void;
  /** A scanned title with no catalog match still prefills the name. */
  onTitle: (title: string) => void;
}

/**
 * Looks up a LEGO set in the imported catalog, by number or name or by scanning the box barcode.
 * Results are text only: no image is requested while someone types.
 */
export function CatalogLookup({ catalogReady, canImport, onPick, onTitle }: Props) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<CatalogHit[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);
  const canScan = useSyncExternalStore(
    () => () => {},
    () => 'BarcodeDetector' in window,
    () => false,
  );

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Typing starts a short timer, so a search runs when the typing pauses, not on every key. */
  function onType(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    const q = value.trim();
    const mine = ++seq.current;
    if (q.length < 2) {
      setHits([]);
      setMessage(null);
      return;
    }
    timer.current = setTimeout(async () => {
      setBusy(true);
      try {
        const res = await fetch(`/api/catalog/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (mine !== seq.current) return; // a newer search replaced this one
        setHits(data.hits ?? []);
        setMessage(
          (data.hits ?? []).length === 0
            ? 'No match in the catalog. You can still fill the form by hand.'
            : null,
        );
      } catch {
        if (mine === seq.current)
          setMessage('The lookup failed. You can still fill the form by hand.');
      } finally {
        if (mine === seq.current) setBusy(false);
      }
    }, 250);
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function scanned(code: string) {
    setScanning(false);
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/lookup/upc?code=${encodeURIComponent(code)}`);
      const data = (await res.json()) as { title: string | null; matches: CatalogHit[] };
      if (data.matches.length > 0) {
        setHits(data.matches);
        setQuery('');
        setMessage(`Scanned: ${data.title}`);
      } else if (data.title) {
        onTitle(data.title);
        setMessage(
          `Scanned “${data.title}”, but no catalog set matched. The name is filled in for you.`,
        );
      } else {
        setMessage('That barcode was not recognized. Search by number or name instead.');
      }
    } catch {
      setMessage('The barcode lookup failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${ui.panel} ${ui.pad}`} aria-labelledby="lookup-heading">
      <div className={ui.panelHead}>
        <h2 id="lookup-heading">Look up a LEGO set</h2>
        <p className={ui.small}>
          Catalog data from <a href="https://rebrickable.com/">Rebrickable</a>
        </p>
      </div>
      {!catalogReady ? (
        <div role="status">
          <Note>
            The catalog has not been imported yet, so lookup is off.{' '}
            {canImport ? (
              <>
                <Link href="/settings/catalog">Import it in Settings</Link>.
              </>
            ) : (
              'Ask an admin to import it.'
            )}{' '}
            Other brands are always added by hand below.
          </Note>
        </div>
      ) : (
        <div className={classes.lookup}>
          <TextInput
            label="Set number or name"
            placeholder="10294 or Titanic"
            value={query}
            onChange={(e) => onType(e.currentTarget.value)}
            leftSection={<IconSearch size={20} stroke={1.75} />}
            rightSectionWidth={canScan ? 46 : undefined}
            rightSection={
              canScan ? (
                <ActionIcon
                  variant="subtle"
                  size={44}
                  aria-label="Scan a barcode"
                  onClick={() => setScanning(true)}
                >
                  <IconBarcode size={24} stroke={1.75} />
                </ActionIcon>
              ) : undefined
            }
          />
          {message && (
            <p className={ui.small} role="status">
              {message}
            </p>
          )}
          {busy && hits.length === 0 && (
            <p className={ui.small} role="status">
              Searching
            </p>
          )}
          {hits.length > 0 && (
            <ul className={classes.hits} aria-label="Catalog matches">
              {hits.map((h) => (
                <li key={h.setNum}>
                  <UnstyledButton type="button" className={classes.hit} onClick={() => onPick(h)}>
                    <b>{h.name}</b>
                    <span className={classes.meta}>
                      <span className="app-mono">{h.number}</span>
                      {h.year ? ` · ${h.year}` : ''}
                      {h.pieces ? ` · ${h.pieces.toLocaleString('en-US')} pieces` : ''}
                      {h.theme ? ` · ${h.theme}` : ''}
                      {h.wishers && h.wishers.length > 0
                        ? ` · On ${h.wishers.join(' and ')}’s wishlist`
                        : ''}
                    </span>
                  </UnstyledButton>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <Modal opened={scanning} onClose={() => setScanning(false)} title="Scan a barcode" size={440}>
        {scanning && (
          <div className={classes.scanBody}>
            <Scanner
              onCode={scanned}
              onError={(m) => {
                setScanning(false);
                toastFailed(m);
              }}
            />
            <p className={classes.scanText}>
              Point the camera at the barcode on the box. When it reads, the number goes into the
              lookup and this closes.
            </p>
          </div>
        )}
        <DialogFoot>
          <Button variant="default" onClick={() => setScanning(false)}>
            Cancel
          </Button>
        </DialogFoot>
      </Modal>
    </section>
  );
}

function Scanner({
  onCode,
  onError,
}: {
  onCode: (code: string) => void;
  onError: (m: string) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const run = { stop: false };
    let stream: MediaStream | undefined;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (!video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        const detector = new BarcodeDetector({ formats: ['ean_13', 'upc_a', 'ean_8', 'upc_e'] });
        while (!run.stop) {
          const found = await detector.detect(video.current).catch(() => []);
          if (found[0]) return onCode(found[0].rawValue);
          await new Promise((r) => setTimeout(r, 300));
        }
      } catch {
        onError('Could not open the camera.');
      }
    })();
    return () => {
      run.stop = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onCode, onError]);

  return (
    <div className={classes.scan} role="img" aria-label="Camera view">
      <video ref={video} playsInline muted className={classes.video} />
      <span className={classes.frame} aria-hidden />
    </div>
  );
}
