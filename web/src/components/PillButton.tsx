import type { ReactNode } from 'react'
import './pill.css'

interface Props { label: string; onClick?: () => void; icon?: ReactNode }

export function ArrowRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function PillButton({ label, onClick, icon = <ArrowRight /> }: Props) {
  return (
    <button className="pill pill--action" onClick={onClick}>
      <span className="pill__label">{label}</span>
      <span className="pill__dot">{icon}</span>
    </button>
  )
}
