import { useDashboard } from '../state/store'
import './pill.css'

export function StatusPill() {
  const paused = useDashboard((s) => s.paused)
  const estopped = useDashboard((s) => s.estopped)
  const toggle = useDashboard((s) => s.togglePaused)
  return (
    <div className="pill status">
      <span className="status__k">Status</span>
      <b className="status__v">{estopped ? 'E-Stop' : paused ? 'Paused' : 'On Mission 1234'}</b>
      <button className="pill__dot" onClick={toggle} disabled={estopped} aria-label={paused ? 'Resume mission' : 'Pause mission'}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          {paused ? <path d="M7 4l13 8-13 8z" /> : <path d="M6 4h4v16H6zM14 4h4v16h-4z" />}
        </svg>
      </button>
    </div>
  )
}
