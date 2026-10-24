import { useDashboard } from '../state/store'
import './estop.css'

export function EmergencyStop() {
  const estopped = useDashboard((s) => s.estopped)
  const toggle = useDashboard((s) => s.toggleEstop)
  return (
    <button className={`estop ${estopped ? 'is-latched' : ''}`} onClick={toggle} aria-pressed={estopped}
      aria-label={estopped ? 'Emergency stop engaged, press to release' : 'Emergency stop'}>
      <svg viewBox="0 0 100 100" aria-hidden>
        <defs><path id="arc" d="M14 50a36 36 0 0172 0" /></defs>
        <circle cx="50" cy="50" r="48" fill="var(--estop-yellow)" />
        <text fontSize="8" fontWeight="800" letterSpacing="1"><textPath href="#arc" startOffset="50%" textAnchor="middle">EMERGENCY</textPath></text>
        <circle cx="50" cy="52" r="29" fill="var(--danger)" stroke="#fff" strokeWidth="3" />
        <path d="M38 48a13 13 0 0121-6M62 56a13 13 0 01-21 6" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
        <text x="50" y="94" fontSize="8" fontWeight="800" textAnchor="middle">STOP</text>
      </svg>
    </button>
  )
}
