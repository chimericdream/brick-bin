'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  Alert,
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { IconBarcode, IconSearch } from '@tabler/icons-react';
import Link from 'next/link';

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
        setMessage('That barcode was not recognised. Search by number or name instead.');
      }
    } catch {
      setMessage('The barcode lookup failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Paper withBorder p="md">
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Text fw={700}>Look up a LEGO set</Text>
          <Text size="xs" c="dimmed">
            Catalog data from <a href="https://rebrickable.com">Rebrickable</a>
          </Text>
        </Group>
        {!catalogReady ? (
          <Alert color="blue" variant="light" role="status">
            The catalog has not been imported yet, so lookup is off.{' '}
            {canImport ? (
              <>
                <Link href="/settings/catalog">Import it in Settings</Link>.
              </>
            ) : (
              'Ask an admin to import it.'
            )}{' '}
            Other brands are always added by hand below.
          </Alert>
        ) : (
          <>
            <Group gap="xs" wrap="nowrap" align="flex-end">
              <TextInput
                label="Set number or name"
                placeholder="10294 or Titanic"
                value={query}
                onChange={(e) => onType(e.currentTarget.value)}
                leftSection={<IconSearch size={16} />}
                style={{ flex: 1 }}
              />
              {canScan && (
                <Button
                  variant="default"
                  leftSection={<IconBarcode size={18} />}
                  onClick={() => setScanning(true)}
                >
                  Scan barcode
                </Button>
              )}
            </Group>
            {message && (
              <Text size="sm" c="dimmed" role="status">
                {message}
              </Text>
            )}
            {busy && hits.length === 0 && (
              <Text size="sm" c="dimmed" role="status">
                Searching
              </Text>
            )}
            {hits.length > 0 && (
              <ul className={classes.hits} aria-label="Catalog matches">
                {hits.map((h) => (
                  <li key={h.setNum}>
                    <UnstyledButton type="button" className={classes.hit} onClick={() => onPick(h)}>
                      <span>
                        <strong>{h.name}</strong>
                        <span className={classes.meta}>
                          {h.number}
                          {h.year ? ` · ${h.year}` : ''}
                          {h.pieces ? ` · ${h.pieces.toLocaleString('en-US')} pieces` : ''}
                          {h.theme ? ` · ${h.theme}` : ''}
                          {h.wishers && h.wishers.length > 0
                            ? ` · On ${h.wishers.join(' and ')}’s wishlist`
                            : ''}
                        </span>
                      </span>
                    </UnstyledButton>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Stack>
      <Modal
        opened={scanning}
        onClose={() => setScanning(false)}
        title="Scan the barcode on the box"
        centered
      >
        {scanning && (
          <Scanner onCode={scanned} onError={(m) => (setScanning(false), setMessage(m))} />
        )}
      </Modal>
    </Paper>
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

  return <video ref={video} playsInline muted style={{ width: '100%', borderRadius: 8 }} />;
}
