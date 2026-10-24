export interface Pose { x: number; y: number; heading: number }
export interface Telemetry {
  battery: number
  signal: 'Strong' | 'Weak' | 'Lost'
  failsafe: 'Okay' | 'Fault'
  system: 'Okay' | 'Fault'
}

export interface RobotSnapshot { pose: Pose; telemetry: Telemetry }

// Anything that can feed the dashboard: the static replay today, a rosbridge client later.
export interface RobotSource {
  start(onUpdate: (snap: RobotSnapshot) => void): void
  stop(): void
  setPaused(paused: boolean): void
}
