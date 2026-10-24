import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { MutableRefObject, ReactNode } from 'react'

export interface MapLabel { id: string; position: [number, number]; follow?: () => [number, number] | null; angle?: () => number; node: ReactNode }

const v = new Vector3()

// Lives inside <Canvas>: each frame, projects label world positions to screen space and moves
// the matching DOM node. Labels are plain DOM so they need no extra React roots (unlike drei <Html>).
export function LabelProjector({ labels, els }: { labels: MapLabel[]; els: MutableRefObject<(HTMLDivElement | null)[]> }) {
  useFrame(({ camera, size }) => {
    labels.forEach((l, i) => {
      const el = els.current[i]
      if (!el) return
      const at = l.follow ? l.follow() : l.position
      el.style.display = at ? '' : 'none'
      if (!at) return
      const [x, y] = at
      v.set(x, y, 0).project(camera)
      // World +y is up on screen but CSS rotates clockwise, hence the negated heading.
      const turn = l.angle ? ` rotate(${-l.angle()}rad)` : ''
      el.style.transform = `translate(${(v.x * 0.5 + 0.5) * size.width}px, ${(-v.y * 0.5 + 0.5) * size.height}px) translate(-50%, -50%)${turn}`
    })
  })
  return null
}
