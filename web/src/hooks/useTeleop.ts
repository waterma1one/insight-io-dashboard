import { useCallback, useEffect, useRef } from 'react'
import { useDashboard } from '../state/store'
import { commandFromDirs, dirForKey, type Dir } from './teleopCommand'

// Held WASD keys and pad presses feed one set of directions; the set becomes the store's drive
// command. Only active in MANUAL; leaving MANUAL or losing focus releases everything.
export function useTeleop() {
  const manual = useDashboard((s) => s.mode === 'manual' && !s.estopped)
  const held = useRef(new Set<Dir>())

  const publish = useCallback(() => useDashboard.getState().setCommand(commandFromDirs(held.current)), [])
  const press = useCallback((d: Dir) => { held.current.add(d); publish() }, [publish])
  const release = useCallback((d: Dir) => { held.current.delete(d); publish() }, [publish])

  useEffect(() => {
    if (!manual) return
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      const d = dirForKey(e.key)
      if (!d || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA)$/.test(e.target.tagName) && (e.target as HTMLInputElement).type !== 'range') return
      e.preventDefault()
      if (down) press(d); else release(d)
    }
    const down = onKey(true)
    const up = onKey(false)
    const clear = () => { held.current.clear(); publish() }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
      clear()
    }
  }, [manual, press, release, publish])

  return { press, release }
}
