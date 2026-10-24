import './nav.css'

const ICONS = [
  'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  'M9 4l-5 2v14l5-2 6 2 5-2V4l-5 2z M9 4v14 M15 6v14',
  'M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z M12 12a2 2 0 100-4 2 2 0 000 4',
  'M5 5h14v14H5z M3 3h4v4H3z M17 3h4v4h-4z M3 17h4v4H3z M17 17h4v4h-4z',
  'M12 4v4M12 16v4M4 12h4M16 12h4 M12 12m-5 0a5 5 0 1010 0 5 5 0 10-10 0',
  'M3 17l5-6 4 3 4-7 5 5',
]

export function SideNav() {
  return (
    <nav className="nav" aria-label="Primary">
      <div className="nav__logo">ERIC<small>ROBOTICS</small></div>
      <ul>
        {ICONS.map((d, i) => (
          <li key={i}>
            <button className={i === 0 ? 'is-active' : ''} aria-label={`Section ${i + 1}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={i === 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d={d} /></svg>
            </button>
          </li>
        ))}
      </ul>
      <button className="nav__user" aria-label="Account">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
      </button>
    </nav>
  )
}
