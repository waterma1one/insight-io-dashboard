import { describe, expect, it } from 'vitest'
import { heightColor } from './heightColor'

describe('heightColor', () => {
  it('keeps floor lighter than clutter, and clutter lighter than walls', () => {
    const lum = ([r, g, b]: number[]) => r + g + b
    expect(lum(heightColor(0))).toBeGreaterThan(lum(heightColor(1)))
    expect(lum(heightColor(1))).toBeGreaterThan(lum(heightColor(3)))
  })
  it('returns channels in 0..1', () => {
    for (const z of [-0.1, 0, 0.5, 2.9, 10]) {
      for (const c of heightColor(z)) {
        expect(c).toBeGreaterThanOrEqual(0)
        expect(c).toBeLessThanOrEqual(1)
      }
    }
  })
})
