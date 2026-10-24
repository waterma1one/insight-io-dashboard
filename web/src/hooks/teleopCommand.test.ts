import { describe, expect, it } from 'vitest'
import { commandFromDirs, dirForKey } from './teleopCommand'

describe('teleop command', () => {
  it('maps WASD, any case', () => {
    expect(dirForKey('w')).toBe('up')
    expect(dirForKey('A')).toBe('left')
    expect(dirForKey('x')).toBeUndefined()
  })
  it('combines directions and cancels opposites', () => {
    expect(commandFromDirs(new Set(['up', 'left']))).toEqual({ linear: 1, angular: 1 })
    expect(commandFromDirs(new Set(['up', 'down']))).toEqual({ linear: 0, angular: 0 })
    expect(commandFromDirs(new Set(['right']))).toEqual({ linear: 0, angular: -1 })
  })
})
