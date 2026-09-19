import { useMemo } from 'react';
import type { FlowItem } from '../content/model';

interface El { id: string; kind: FlowItem['kind'] | 'connector'; x: number; y: number; w: number; h: number; lines: string[] }
interface Edge { pts: [number, number][]; label?: string; arrow?: boolean }
interface Lay { els: El[]; edges: Edge[]; left: number; right: number; height: number }

const GAP = 22, CH = 6.9, LH = 14;

function wrap(text: string, max = 30): string[] {
  const out: string[] = [];
  for (const raw of text.split('\n')) {
    let line = '';
    for (const word of raw.split(' ')) {
      if ((line + ' ' + word).trim().length > max && line) { out.push(line); line = word; }
      else line = (line ? line + ' ' : '') + word;
    }
    out.push(line);
  }
  return out;
}

function measure(it: FlowItem): { w: number; h: number; lines: string[] } {
  const lines = wrap(it.text, it.kind === 'decision' || it.kind === 'loop' ? 20 : 32);
  const tw = Math.max(...lines.map(l => l.length)) * CH;
  if (it.kind === 'start' || it.kind === 'end') return { w: Math.max(96, tw + 40), h: 34, lines };
  if (it.kind === 'decision' || it.kind === 'loop') return { w: Math.max(150, tw * 1.55 + 30), h: Math.max(64, lines.length * LH * 1.7 + 30), lines };
  return { w: Math.min(300, Math.max(130, tw + 34)), h: lines.length * LH + 18, lines };
}

function shift(l: Lay, dx: number, dy: number): Lay {
  return {
    els: l.els.map(e => ({ ...e, x: e.x + dx, y: e.y + dy })),
    edges: l.edges.map(g => ({ ...g, pts: g.pts.map(([x, y]) => [x + dx, y + dy] as [number, number]) })),
    left: l.left + dx, right: l.right + dx, height: l.height,
  };
}

function layItem(it: FlowItem & { id?: string }): Lay {
  const m = measure(it);
  const id = (it as { id?: string }).id!;
  if (it.kind === 'decision') {
    const d: El = { id, kind: 'decision', x: 0, y: 0, w: m.w, h: m.h, lines: m.lines };
    const no = laySeq(it.no), yes = laySeq(it.yes);
    const noTop = m.h + GAP;
    const yesTop = m.h / 2 + GAP;
    const yesAxis = Math.max(m.w / 2, no.right) + GAP + Math.max(-yes.left, 60);
    const noB = noTop + no.height, yesB = yesTop + yes.height;
    const mergeY = Math.max(noB, yesB) + GAP;
    const edges: Edge[] = [];
    if (no.els.length) { edges.push({ pts: [[0, m.h], [0, noTop]], label: it.noLabel ?? 'FALSE', arrow: true }); edges.push({ pts: [[0, noB], [0, mergeY - 6]], arrow: true }); }
    else edges.push({ pts: [[0, m.h], [0, mergeY - 6]], label: it.noLabel ?? 'FALSE', arrow: true });
    if (yes.els.length) { edges.push({ pts: [[m.w / 2, m.h / 2], [yesAxis, m.h / 2], [yesAxis, yesTop]], label: it.yesLabel ?? 'TRUE', arrow: true }); edges.push({ pts: [[yesAxis, yesB], [yesAxis, mergeY], [6, mergeY]], arrow: true }); }
    else edges.push({ pts: [[m.w / 2, m.h / 2], [yesAxis, m.h / 2], [yesAxis, mergeY], [6, mergeY]], label: it.yesLabel ?? 'TRUE', arrow: true });
    const conn: El = { id: id + 'c', kind: 'connector', x: 0, y: mergeY - 6, w: 12, h: 12, lines: [] };
    const n2 = shift(no, 0, noTop), y2 = shift(yes, yesAxis, yesTop);
    return { els: [d, ...n2.els, ...y2.els, conn], edges: [...edges, ...n2.edges, ...y2.edges], left: Math.min(-m.w / 2, n2.left), right: Math.max(y2.right, yesAxis + 20), height: mergeY + 6 };
  }
  if (it.kind === 'loop') {
    const d: El = { id, kind: 'loop', x: 0, y: 0, w: m.w, h: m.h, lines: m.lines };
    const body = shift(laySeq(it.body), 0, m.h + GAP);
    const bodyB = m.h + GAP + body.height;
    const backX = Math.min(-m.w / 2, body.left) - GAP;
    const exitX = Math.max(m.w / 2, body.right) + GAP + 14;
    const exitY = bodyB + 34;
    const edges: Edge[] = [
      { pts: [[0, m.h], [0, m.h + GAP]], label: 'TRUE', arrow: true },
      { pts: [[0, bodyB], [0, bodyB + 14], [backX, bodyB + 14], [backX, m.h / 2], [-m.w / 2, m.h / 2]], arrow: true },
      { pts: [[m.w / 2, m.h / 2], [exitX, m.h / 2], [exitX, exitY], [0, exitY]], label: 'FALSE', arrow: false },
    ];
    return { els: [d, ...body.els], edges: [...edges, ...body.edges], left: backX - 6, right: exitX + 6, height: exitY };
  }
  const el: El = { id, kind: it.kind, x: 0, y: 0, w: m.w, h: m.h, lines: m.lines };
  return { els: [el], edges: [], left: -m.w / 2, right: m.w / 2, height: m.h };
}

function laySeq(items: FlowItem[]): Lay {
  let y = 0; const out: Lay = { els: [], edges: [], left: 0, right: 0, height: 0 };
  items.forEach((it, i) => {
    const l = shift(layItem(it), 0, y);
    if (i > 0) out.edges.push({ pts: [[0, y - GAP], [0, y]], arrow: true });
    out.els.push(...l.els); out.edges.push(...l.edges);
    out.left = Math.min(out.left, l.left); out.right = Math.max(out.right, l.right);
    y += l.height + GAP;
  });
  out.height = Math.max(0, y - GAP);
  return out;
}

/** Give every node a stable id in document order. */
export function withIds(items: FlowItem[], prefix = 'n'): FlowItem[] {
  let k = 0;
  const walk = (list: FlowItem[]): FlowItem[] => list.map(it => {
    const id = `${prefix}${k++}`;
    if (it.kind === 'decision') return { ...it, id, yes: walk(it.yes), no: walk(it.no) } as FlowItem;
    if (it.kind === 'loop') return { ...it, id, body: walk(it.body) } as FlowItem;
    return { ...it, id } as FlowItem;
  });
  return walk(items);
}

/** Map source line numbers (1-based) to flowchart node ids, using each node's code fragments ("frag#n" = n-th occurrence). */
export function flowLineMap(items: FlowItem[], source: string): Map<number, string> {
  const lines = source.split('\n');
  const map = new Map<number, string>();
  const walk = (list: FlowItem[]) => list.forEach(it => {
    const id = (it as { id?: string }).id!;
    for (const ref of it.code ?? []) {
      const [frag, nth] = ref.split('#');
      const hits: number[] = [];
      lines.forEach((l, i) => { if (l.includes(frag)) hits.push(i + 1); });
      const chosen = nth ? [hits[+nth - 1]].filter(Boolean) : hits;
      chosen.forEach(h => map.set(h, id));
    }
    if (it.kind === 'decision') { walk(it.yes); walk(it.no); }
    if (it.kind === 'loop') walk(it.body);
  });
  walk(items);
  return map;
}

export function FlowchartView({ items, active, seen, label = 'Flowchart' }: { items: FlowItem[]; active?: string | null; seen?: Set<string>; label?: string }) {
  const lay = useMemo(() => laySeq(items), [items]);
  const pad = 14;
  const W = lay.right - lay.left + pad * 2, H = lay.height + pad * 2;
  const ox = -lay.left + pad, oy = pad;
  return (
    <div className="flow-wrap" role="img" aria-label={label}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" className="farrow" /></marker>
        </defs>
        <g transform={`translate(${ox},${oy})`}>
          {lay.edges.map((e, i) => (
            <g key={i}>
              <polyline className="fedge" points={e.pts.map(p => p.join(',')).join(' ')} markerEnd={e.arrow ? 'url(#fa)' : undefined} />
              {e.label && <text className="fedge-label" x={e.pts[0][0] + (e.pts[1][0] > e.pts[0][0] ? 8 : 5)} y={e.pts[0][1] + (e.pts[1][0] > e.pts[0][0] ? -5 : 13)}>{e.label}</text>}
            </g>
          ))}
          {lay.els.map(el => {
            const cls = `fnode${el.id === active ? ' on' : seen?.has(el.id) ? ' seen' : ''}`;
            const x = el.x - el.w / 2, y = el.y;
            let shape;
            if (el.kind === 'start' || el.kind === 'end') shape = <rect x={x} y={y} width={el.w} height={el.h} rx={el.h / 2} />;
            else if (el.kind === 'decision' || el.kind === 'loop') shape = <polygon points={`${el.x},${y} ${el.x + el.w / 2},${y + el.h / 2} ${el.x},${y + el.h} ${el.x - el.w / 2},${y + el.h / 2}`} />;
            else if (el.kind === 'io') shape = <polygon points={`${x + 10},${y} ${x + el.w + 10},${y} ${x + el.w - 10},${y + el.h} ${x - 10},${y + el.h}`} />;
            else if (el.kind === 'connector') shape = <ellipse cx={el.x} cy={y + 6} rx={6} ry={6} />;
            else shape = <rect x={x} y={y} width={el.w} height={el.h} rx={3} />;
            const ty = y + el.h / 2 - ((el.lines.length - 1) * LH) / 2 + 4;
            return (
              <g key={el.id} className={cls}>
                {shape}
                {el.lines.map((ln, i) => <text key={i} x={el.x} y={ty + i * LH} textAnchor="middle">{ln}</text>)}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
