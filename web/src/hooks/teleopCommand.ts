import type { DriveCommand } from '../data/source'

export type Dir = 'up' | 'down' | 'left' | 'right'

const KEY_TO_DIR: Record<string, Dir> = { w: 'up', s: 'down', a: 'left', d: 'right' }
export const dirForKey = (key: string): Dir | undefined => KEY_TO_DIR[key.toLowerCase()]

// Opposite directions cancel. Left turns counter-clockwise, so angular is positive.
export function commandFromDirs(dirs: ReadonlySet<Dir>): DriveCommand {
  return {
    linear: (dirs.has('up') ? 1 : 0) - (dirs.has('down') ? 1 : 0),
    angular: (dirs.has('left') ? 1 : 0) - (dirs.has('right') ? 1 : 0),
  }
}
