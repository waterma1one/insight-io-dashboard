// Generates a synthetic warehouse point cloud (public/assets/map.pcd) plus the zone
// polygons and patrol waypoints (public/assets/layout.json) in one shared frame.
// Seeded, so output is reproducible. Run: npm run assets
import { writeFileSync } from 'node:fs'

const rng = (seed) => { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32 }
const rand = rng(42)
const jitter = (a) => (rand() - 0.5) * 2 * a

const CX = 13, CY = 19 // local layout centre
const ANG = (-12 * Math.PI) / 180 // the demo map is slightly rotated
const to = ([x, y]) => {
  const dx = x - CX, dy = y - CY
  return [dx * Math.cos(ANG) - dy * Math.sin(ANG), dx * Math.sin(ANG) + dy * Math.cos(ANG)]
}

const OUTLINE = [[0, 0], [26, 0], [26, 38], [6, 38], [6, 32], [0, 32]]
const INNER_WALLS = [[[10, 0], [10, 10]]]
const ZONES = [
  { name: 'Inventory A', rect: [2, 20, 9, 31] },
  { name: 'Staging', rect: [14, 24, 24, 36] },
  { name: 'Loading Bay', rect: [14, 2, 24, 12] },
  { name: 'Charging', rect: [2, 2, 8, 8] },
  { name: 'Restricted', rect: [16, 15, 24, 21] },
]
const WAYPOINTS = [[4, 15], [12, 15], [12, 28], [12, 14], [20, 13], [12, 13]]

const pts = []
const add = (x, y, z) => { const [rx, ry] = to([x + jitter(0.02), y + jitter(0.02)]); pts.push(rx, ry, z + jitter(0.01)) }

const inside = (x, y) => {
  let c = false
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const [xi, yi] = OUTLINE[i], [xj, yj] = OUTLINE[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

const wall = ([ax, ay], [bx, by], h = 3) => {
  const len = Math.hypot(bx - ax, by - ay)
  for (let d = 0; d < len; d += 0.08) {
    const t = d / len
    for (let z = 0.1; z <= h; z += 0.12) add(ax + (bx - ax) * t, ay + (by - ay) * t, z)
  }
}

const box = (x0, y0, x1, y1, h) => {
  wall([x0, y0], [x1, y0], h); wall([x1, y0], [x1, y1], h); wall([x1, y1], [x0, y1], h); wall([x0, y1], [x0, y0], h)
  for (let x = x0; x <= x1; x += 0.2) for (let y = y0; y <= y1; y += 0.2) add(x, y, h)
}

// floor
for (let x = 0; x <= 26; x += 0.15) for (let y = 0; y <= 38; y += 0.15) if (inside(x, y)) add(x, y, 0)
// walls
OUTLINE.forEach((p, i) => wall(p, OUTLINE[(i + 1) % OUTLINE.length]))
INNER_WALLS.forEach(([a, b]) => wall(a, b))
// racks in Inventory A, pallets in Staging
for (const y of [22, 25, 28]) box(3, y, 8, y + 1, 2)
for (const [x, y] of [[16, 26], [19.5, 26], [16, 31], [19.5, 31]]) box(x, y, x + 2.5, y + 2.5, 1.2)
// loose clutter
for (let i = 0; i < 28; i++) {
  const x = 1 + rand() * 24, y = 1 + rand() * 36
  if (!inside(x, y) || Math.hypot(x - 4, y - 15) < 2) continue
  for (let a = 0; a < 6.28; a += 0.4) for (let z = 0.1; z <= 1; z += 0.15) add(x + Math.cos(a) * 0.3, y + Math.sin(a) * 0.3, z)
}

const n = pts.length / 3
const header = `# .PCD v0.7\nVERSION 0.7\nFIELDS x y z\nSIZE 4 4 4\nTYPE F F F\nCOUNT 1 1 1\nWIDTH ${n}\nHEIGHT 1\nVIEWPOINT 0 0 0 1 0 0 0\nPOINTS ${n}\nDATA binary\n`
writeFileSync('public/assets/map.pcd', Buffer.concat([Buffer.from(header), Buffer.from(new Float32Array(pts).buffer)]))

const rect = ([x0, y0, x1, y1]) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(to)
const outline = OUTLINE.map(to)
const xs = outline.map((p) => p[0]), ys = outline.map((p) => p[1])
writeFileSync('public/assets/layout.json', JSON.stringify({
  bounds: { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) },
  zones: ZONES.map((z) => ({ name: z.name, polygon: rect(z.rect) })),
  waypoints: WAYPOINTS.map(to),
}, null, 1))
console.log(`map.pcd: ${n} points`)
