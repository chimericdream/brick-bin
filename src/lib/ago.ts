/** "2 days ago", "3 hours ago", "just now". */
export function ago(from: Date, now = new Date()): string {
  const s = Math.max(0, Math.round((now.getTime() - from.getTime()) / 1000));
  const units: [number, string][] = [
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ];
  for (const [size, name] of units) {
    if (s >= size) {
      const n = Math.floor(s / size);
      return `${n} ${name}${n === 1 ? '' : 's'} ago`;
    }
  }
  return 'just now';
}
