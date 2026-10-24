export interface Zone { name: string; polygon: [number, number][] }
export interface Layout {
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
  zones: Zone[]
  waypoints: [number, number][]
}

export const ASSETS = {
  pcd: `${import.meta.env.BASE_URL}assets/map.pcd`,
  layout: `${import.meta.env.BASE_URL}assets/layout.json`,
  video: `${import.meta.env.BASE_URL}assets/camera.mp4`,
}

export async function loadLayout(): Promise<Layout> {
  const res = await fetch(ASSETS.layout)
  if (!res.ok) throw new Error(`layout.json: ${res.status}`)
  return res.json()
}
