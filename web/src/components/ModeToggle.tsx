import { useDashboard, type Mode } from '../state/store'
import './mode.css'

const MODES: Mode[] = ['auto', 'manual']

export function ModeToggle() {
  const mode = useDashboard((s) => s.mode)
  const setMode = useDashboard((s) => s.setMode)
  return (
    <div className="pill mode" role="radiogroup" aria-label="Drive mode">
      <span className="mode__k">Mode</span>
      <div className="mode__seg">
        {MODES.map((m) => (
          <button key={m} role="radio" aria-checked={mode === m} className={mode === m ? 'is-on' : ''} onClick={() => setMode(m)}>
            {m}
          </button>
        ))}
      </div>
    </div>
  )
}
