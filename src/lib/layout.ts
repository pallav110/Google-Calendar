// Pack overlapping timed events into side-by-side columns within their cluster,
// returning a horizontal slot (left + width as 0..1 fractions) for each.
export type Positioned<T> = { item: T; left: number; width: number };

const ms = (s: string) => new Date(s).getTime();

export function packColumns<T extends { start: string; end: string }>(items: T[]): Positioned<T>[] {
  const sorted = [...items].sort((a, b) => ms(a.start) - ms(b.start) || ms(b.end) - ms(a.end));
  const out: Positioned<T>[] = [];

  let cluster: T[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    if (!cluster.length) return;
    // Greedy column assignment: reuse the first column that has freed up.
    const colEnds: number[] = [];
    const colOf = new Map<T, number>();
    for (const ev of cluster) {
      let placed = false;
      for (let c = 0; c < colEnds.length; c++) {
        if (ms(ev.start) >= colEnds[c]) {
          colEnds[c] = ms(ev.end);
          colOf.set(ev, c);
          placed = true;
          break;
        }
      }
      if (!placed) {
        colOf.set(ev, colEnds.length);
        colEnds.push(ms(ev.end));
      }
    }
    const cols = colEnds.length;
    for (const ev of cluster) {
      const c = colOf.get(ev)!;
      out.push({ item: ev, left: c / cols, width: 1 / cols });
    }
    cluster = [];
  };

  for (const ev of sorted) {
    if (cluster.length && ms(ev.start) >= clusterEnd) flush();
    cluster.push(ev);
    clusterEnd = Math.max(clusterEnd, ms(ev.end));
  }
  flush();

  return out;
}
