/* Icon.tsx — the Assessment 2 SVG sprite (js/icons.js) redrawn with react-native-svg.
   UI icons use ids i-* (24×24, stroke), pest glyphs use p-* (64×64, stroke). */

import type { ColorValue } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

type Shape =
  | ['path', { d: string; fill?: boolean; transform?: string }]
  | ['circle', { cx: number; cy: number; r: number; fill?: boolean }]
  | ['ellipse', { cx: number; cy: number; rx: number; ry: number; transform?: string }]
  | ['rect', { x: number; y: number; width: number; height: number; rx?: number }];

type Def = { box: 24 | 64; sw: number; filled?: boolean; shapes: Shape[] };

const P = (d: string): Shape => ['path', { d }];

const ICONS: Record<string, Def> = {
  'i-menu': { box: 24, sw: 2, shapes: [P('M4 7h16M4 12h16M4 17h16')] },
  'i-close': { box: 24, sw: 2, shapes: [P('M6 6l12 12M18 6L6 18')] },
  'i-check': { box: 24, sw: 2.5, shapes: [P('M5 12.5l4.5 4.5L19 7.5')] },
  'i-arrow': { box: 24, sw: 2, shapes: [P('M5 12h14M13 6l6 6-6 6')] },
  'i-back': { box: 24, sw: 2, shapes: [P('M19 12H5M11 6l-6 6 6 6')] },
  'i-chev': { box: 24, sw: 2, shapes: [P('M9 6l6 6-6 6')] },
  'i-shield': { box: 24, sw: 2, shapes: [P('M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z'), P('M9 12l2 2 4-4')] },
  'i-lock': { box: 24, sw: 2, shapes: [['rect', { x: 5, y: 11, width: 14, height: 10, rx: 2 }], P('M8 11V8a4 4 0 018 0v3')] },
  'i-clock': { box: 24, sw: 2, shapes: [['circle', { cx: 12, cy: 12, r: 9 }], P('M12 7v5l3 2')] },
  'i-cal': { box: 24, sw: 2, shapes: [['rect', { x: 3, y: 5, width: 18, height: 16, rx: 2 }], P('M3 10h18M8 3v4M16 3v4')] },
  'i-camera': { box: 24, sw: 2, shapes: [P('M4 8h3l2-3h6l2 3h3v11H4z'), ['circle', { cx: 12, cy: 13, r: 3.5 }]] },
  'i-image': { box: 24, sw: 2, shapes: [['rect', { x: 3, y: 4, width: 18, height: 16, rx: 2 }], ['circle', { cx: 9, cy: 10, r: 2 }], P('M21 16l-5-5-9 9')] },
  'i-pin': { box: 24, sw: 2, shapes: [P('M12 21s-7-6.5-7-11a7 7 0 0114 0c0 4.5-7 11-7 11z'), ['circle', { cx: 12, cy: 10, r: 2.5 }]] },
  'i-phone': { box: 24, sw: 2, shapes: [P('M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z')] },
  'i-dollar': { box: 24, sw: 2, shapes: [P('M12 3v18M16 7.5c0-1.5-1.8-2.5-4-2.5s-4 1-4 2.5S10 10 12 10s4 .5 4 2.5S14 16 12 16s-4-1-4-2.5')] },
  'i-search': { box: 24, sw: 2, shapes: [['circle', { cx: 11, cy: 11, r: 6.5 }], P('M20 20l-4-4')] },
  'i-doc': { box: 24, sw: 2, shapes: [P('M7 3h7l5 5v13H7z'), P('M14 3v5h5M10 13h6M10 17h6')] },
  'i-home': { box: 24, sw: 2, shapes: [P('M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z')] },
  'i-user': { box: 24, sw: 2, shapes: [['circle', { cx: 12, cy: 8, r: 4 }], P('M4 21c0-4 3.5-6 8-6s8 2 8 6')] },
  'i-warn': { box: 24, sw: 2, shapes: [P('M12 3l10 18H2z'), P('M12 10v4M12 17.5v.5')] },
  'i-info': { box: 24, sw: 2, shapes: [['circle', { cx: 12, cy: 12, r: 9 }], P('M12 11v5M12 8v.5')] },
  'i-leaf': { box: 24, sw: 2, shapes: [P('M5 19c0-8 5-13 14-14-1 9-6 14-14 14z'), P('M5 19l8-8')] },
  'i-star': { box: 24, sw: 0, filled: true, shapes: [['path', { d: 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z', fill: true }]] },
  'i-bug': { box: 24, sw: 2, shapes: [P('M8 9a4 4 0 018 0v6a4 4 0 01-8 0z'), P('M8 11H4M20 11h-4M8 15l-3 3M16 15l3 3M9 5L7 3M15 5l2-2M12 9v10')] },
  'i-house': { box: 24, sw: 2, shapes: [P('M4 11l8-7 8 7v9H4z'), P('M10 20v-6h4v6')] },
  'i-apt': { box: 24, sw: 2, shapes: [['rect', { x: 5, y: 3, width: 14, height: 18, rx: 1 }], P('M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M11 21v-3h2v3')] },
  'i-town': { box: 24, sw: 2, shapes: [P('M3 20V9l4-4 4 4v11M11 20V12l4-4 4 4v8M3 20h18')] },
  'i-inside': { box: 24, sw: 2, shapes: [['rect', { x: 4, y: 4, width: 16, height: 16, rx: 2 }], P('M9 12h6M12 9v6')] },
  'i-outside': { box: 24, sw: 2, shapes: [P('M12 3v7M8 7l4-4 4 4'), ['rect', { x: 4, y: 12, width: 16, height: 8, rx: 2 }]] },
  'i-both': { box: 24, sw: 2, shapes: [['rect', { x: 3, y: 6, width: 8, height: 12, rx: 1.5 }], ['rect', { x: 13, y: 6, width: 8, height: 12, rx: 1.5 }]] },
  'i-share': { box: 24, sw: 2, shapes: [P('M12 3v12M8 7l4-4 4 4'), P('M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7')] },
  'i-refresh': { box: 24, sw: 2, shapes: [P('M20 11a8 8 0 10-2.3 5.7M20 5v6h-6')] },
  'i-globe': { box: 24, sw: 2, shapes: [['circle', { cx: 12, cy: 12, r: 9 }], P('M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18')] },

  'p-cockroach': { box: 64, sw: 3, shapes: [['ellipse', { cx: 32, cy: 36, rx: 13, ry: 18 }], P('M32 18v36M26 24c-4-8-8-12-14-14M38 24c4-8 8-12 14-14M20 34H9M44 34h11M21 44l-9 8M43 44l9 8')] },
  'p-ant': { box: 64, sw: 3, shapes: [['circle', { cx: 18, cy: 24, r: 6 }], ['circle', { cx: 32, cy: 32, r: 6 }], ['ellipse', { cx: 47, cy: 41, rx: 9, ry: 7 }], P('M15 19l-4-7M21 19l4-7M27 28l-9-6M38 28l9-6M26 36l-8 8M38 36l8 8M30 38l-4 10M34 38l4 10')] },
  'p-spider': { box: 64, sw: 3, shapes: [['circle', { cx: 32, cy: 36, r: 10 }], ['circle', { cx: 32, cy: 22, r: 5 }], P('M23 30L10 22M41 30l13-8M22 36H8M42 36h14M23 42l-12 9M41 42l12 9M27 46l-6 12M37 46l6 12')] },
  'p-rodent': { box: 64, sw: 3, shapes: [P('M12 40c0-10 8-18 20-18s18 8 18 16c0 4-3 6-7 6H17c-3 0-5-2-5-4z'), ['circle', { cx: 18, cy: 24, r: 6 }], ['circle', { cx: 40, cy: 33, r: 1.5, fill: true }], P('M50 40c6 0 8 4 4 8M46 44l4 0')] },
  'p-termite': { box: 64, sw: 3, shapes: [['circle', { cx: 16, cy: 32, r: 7 }], ['ellipse', { cx: 30, cy: 32, rx: 6, ry: 5 }], ['ellipse', { cx: 46, cy: 32, rx: 11, ry: 8 }], P('M12 27l-5-8M20 27l5-8M28 28l-6-7M28 36l-6 7M34 28l6-7M34 36l6 7')] },
  'p-wasp': { box: 64, sw: 3, shapes: [['ellipse', { cx: 34, cy: 40, rx: 9, ry: 14 }], ['circle', { cx: 34, cy: 20, r: 6 }], P('M27 36h14M27 44h14M43 30c10-8 16-6 12 2M25 30C15 22 9 24 13 32M31 15l-4-6M37 15l4-6')] },
  'p-bedbug': { box: 64, sw: 3, shapes: [['ellipse', { cx: 32, cy: 36, rx: 16, ry: 14 }], P('M18 36h28M22 28h20M22 44h20M32 22v-6M20 22l-6-6M44 22l6-6M17 44l-8 6M47 44l8 6')] },
  'p-flea': { box: 64, sw: 3, shapes: [['ellipse', { cx: 34, cy: 32, rx: 11, ry: 14, transform: 'rotate(-20 34 32)' }], P('M24 24l-8-2M26 32H14M22 40l-9 8M40 44l4 12M46 40c8 2 10 8 6 14M30 14l-2-6')] },
};

export type IconName = keyof typeof ICONS | string;

export function Icon({ name, size = 20, color = 'currentColor', strokeWidth }: { name: IconName; size?: number; color?: ColorValue; strokeWidth?: number }) {
  const def = ICONS[name] ?? ICONS['i-bug'];
  const sw = strokeWidth ?? def.sw;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${def.box} ${def.box}`} fill="none" stroke={def.filled ? 'none' : color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {def.shapes.map(([kind, p], i) => {
        switch (kind) {
          case 'path':
            return <Path key={i} d={p.d} fill={p.fill ? color : 'none'} transform={p.transform} />;
          case 'circle':
            return <Circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={p.fill ? color : 'none'} />;
          case 'ellipse':
            return <Ellipse key={i} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} transform={p.transform} />;
          case 'rect':
            return <Rect key={i} x={p.x} y={p.y} width={p.width} height={p.height} rx={p.rx} />;
        }
      })}
    </Svg>
  );
}
