export function RobotIcon() {
  return (
    <svg className="robot" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#101b2e" strokeWidth="1.8" strokeLinecap="round" aria-label="Robot">
      <path d="M9 4a4.5 4.5 0 016 0M7 6.5a8 8 0 0110 0" />
      <rect x="4" y="13" width="16" height="5" rx="1.5" fill="#101b2e" />
      <circle cx="7" cy="20" r="1.8" fill="#101b2e" /><circle cx="17" cy="20" r="1.8" fill="#101b2e" />
    </svg>
  )
}

// Arrow drawn pointing along +x; LabelProjector rotates it to the robot's heading.
export function HeadingArrow() {
  return (
    <svg className="heading" width="44" height="44" viewBox="-22 -22 44 44" aria-hidden="true">
      <path d="M13 -6 L22 0 L13 6 Z" fill="#e0457b" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export function GoalPin() {
  return (
    <svg className="goal-pin" width="26" height="30" viewBox="0 0 24 28" aria-label="Goal">
      <path d="M12 27C12 27 3 17 3 10a9 9 0 0118 0c0 7-9 17-9 17z" fill="#e0457b" stroke="#fff" strokeWidth="1.5" />
      <circle cx="12" cy="10" r="3.2" fill="#fff" />
    </svg>
  )
}
