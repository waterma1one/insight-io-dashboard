import { useDashboard } from '../state/store'
import './teleop.css'

import type { Dir } from '../hooks/teleopCommand'
const CHEV: Record<Dir, string> = { up: 'M6 14l6-6 6 6', down: 'M6 10l6 6 6-6', left: 'M14 6l-6 6 6 6', right: 'M10 6l6 6-6 6' }

export function TeleopPad({ onPress, onRelease }: { onPress?: (d: Dir) => void; onRelease?: (d: Dir) => void }) {
  const manual = useDashboard((s) => s.mode === 'manual' && !s.estopped)
  return (
    <div className={`pad ${manual ? '' : 'is-off'}`} role="group" aria-label="Manual drive" aria-disabled={!manual}>
      {(Object.keys(CHEV) as Dir[]).map((d) => (
        <button key={d} disabled={!manual} className={`pad__arrow pad__arrow--${d}`} aria-label={`Drive ${d}`}
          onPointerDown={() => onPress?.(d)} onPointerUp={() => onRelease?.(d)} onPointerLeave={() => onRelease?.(d)}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d={CHEV[d]} /></svg>
        </button>
      ))}
      <div className="pad__core">
        <span className="k k-w">W</span><span className="k k-a">A</span><span className="k k-d">D</span><span className="k k-s">S</span>
        <span className="pad__hint">hold key</span>
      </div>
    </div>
  )
}
