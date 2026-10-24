import { describe, expect, it, vi } from 'vitest'
import { StaticSource } from './staticSource'
import type { Layout } from './layout'

const layout: Layout = {
  bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10 },
  zones: [],
  waypoints: [[0, 0], [10, 0], [10, 10]],
}

function run(source: StaticSource, frames: number[]) {
  const queue = [...frames]
  vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => { const t = queue.shift(); if (t !== undefined) cb(t); return 1 })
  vi.stubGlobal('performance', { now: () => 0 })
  const seen: ReturnType<typeof Object>[] = []
  source.start((snap) => seen.push(snap))
  return seen
}

describe('StaticSource', () => {
  it('moves along the first segment heading +x', () => {
    const seen = run(new StaticSource(layout), [1000])
    const { pose } = seen[0] as { pose: { x: number; y: number; heading: number } }
    expect(pose.x).toBeCloseTo(1.2)
    expect(pose.y).toBeCloseTo(0)
    expect(pose.heading).toBeCloseTo(0)
  })

  it('holds position while paused', () => {
    const s = new StaticSource(layout)
    s.setPaused(true)
    const seen = run(s, [1000, 2000]) as { pose: { x: number } }[]
    expect(seen[1].pose.x).toBe(0)
  })

  it('does not drive in MANUAL while paused', () => {
    const s = new StaticSource(layout)
    s.setManual(true)
    s.setCommand({ linear: 1, angular: 0 })
    s.setPaused(true)
    const seen = run(s, [1000, 2000]) as { pose: { x: number } }[]
    expect(seen[1].pose.x).toBe(0)
  })
})
