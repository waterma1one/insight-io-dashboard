import type { Layout } from './layout'
import type { RobotSnapshot, RobotSource } from './source'

const SPEED = 1.2 // m/s along the waypoint loop
const DRAIN_PER_SEC = 0.05 // battery % lost per second of motion

// Replays the robot along layout.waypoints in a closed loop, with slowly draining mock telemetry.
export class StaticSource implements RobotSource {
  private raf = 0
  private paused = false
  private dist = 0
  private battery = 100
  private last = 0
  private readonly layout: Layout
  private readonly segLen: number[]
  private readonly total: number

  constructor(layout: Layout) {
    this.layout = layout
    const pts = layout.waypoints
    this.segLen = pts.map((p, i) => {
      const q = pts[(i + 1) % pts.length]
      return Math.hypot(q[0] - p[0], q[1] - p[1])
    })
    this.total = this.segLen.reduce((a, b) => a + b, 0)
  }

  start(onUpdate: (snap: RobotSnapshot) => void) {
    this.last = performance.now()
    const tick = (now: number) => {
      const dt = (now - this.last) / 1000
      this.last = now
      if (!this.paused) {
        this.dist = (this.dist + SPEED * dt) % this.total
        this.battery = Math.max(0, this.battery - DRAIN_PER_SEC * dt)
      }
      onUpdate(this.snapshot())
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  stop() { cancelAnimationFrame(this.raf) }
  setPaused(paused: boolean) { this.paused = paused }

  private snapshot(): RobotSnapshot {
    const pts = this.layout.waypoints
    let d = this.dist
    let i = 0
    while (d > this.segLen[i]) d -= this.segLen[i++]
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    const t = this.segLen[i] ? d / this.segLen[i] : 0
    return {
      pose: { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, heading: Math.atan2(b[1] - a[1], b[0] - a[0]) },
      telemetry: { battery: Math.round(this.battery), signal: 'Strong', failsafe: 'Okay', system: 'Okay' },
    }
  }
}
