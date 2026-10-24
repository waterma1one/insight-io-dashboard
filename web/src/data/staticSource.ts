import type { Layout } from './layout'
import type { DriveCommand, Pose, RobotSnapshot, RobotSource } from './source'

const SPEED = 1.2 // m/s along the waypoint loop
const MANUAL_LINEAR = 1.8 // m/s at full stick
const MANUAL_ANGULAR = 2 // rad/s at full stick
const DRAIN_PER_SEC = 0.05 // battery % lost per second of motion

// Replays the robot along layout.waypoints in a closed loop, with slowly draining mock telemetry.
export class StaticSource implements RobotSource {
  private raf = 0
  private paused = false
  private dist = 0
  private battery = 100
  private last = 0
  private manual = false
  private cmd: DriveCommand = { linear: 0, angular: 0 }
  private free: Pose = { x: 0, y: 0, heading: 0 }
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
      if (this.manual) {
        this.drive(dt)
      } else if (!this.paused) {
        this.dist = (this.dist + SPEED * dt) % this.total
        this.battery = Math.max(0, this.battery - DRAIN_PER_SEC * dt)
      }
      onUpdate(this.snapshot())
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  setManual(on: boolean) {
    if (on === this.manual) return
    if (on) this.free = this.snapshot().pose
    else this.rejoinRoute()
    this.manual = on
  }

  setCommand(cmd: DriveCommand) { this.cmd = cmd }

  stop() { cancelAnimationFrame(this.raf) }
  setPaused(paused: boolean) { this.paused = paused }

  private drive(dt: number) {
    const { bounds } = this.layout
    const f = this.free
    f.heading += this.cmd.angular * MANUAL_ANGULAR * dt
    f.x = Math.min(bounds.maxX, Math.max(bounds.minX, f.x + Math.cos(f.heading) * this.cmd.linear * MANUAL_LINEAR * dt))
    f.y = Math.min(bounds.maxY, Math.max(bounds.minY, f.y + Math.sin(f.heading) * this.cmd.linear * MANUAL_LINEAR * dt))
    if (this.cmd.linear !== 0) this.battery = Math.max(0, this.battery - DRAIN_PER_SEC * dt)
  }

  // Back in AUTO: resume the loop from the route point nearest to where manual driving ended.
  private rejoinRoute() {
    const pts = this.layout.waypoints
    let best = Infinity
    let run = 0
    let at = this.dist
    pts.forEach((a, i) => {
      const b = pts[(i + 1) % pts.length]
      const len = this.segLen[i]
      const t = len ? Math.min(1, Math.max(0, ((this.free.x - a[0]) * (b[0] - a[0]) + (this.free.y - a[1]) * (b[1] - a[1])) / (len * len))) : 0
      const d = Math.hypot(a[0] + (b[0] - a[0]) * t - this.free.x, a[1] + (b[1] - a[1]) * t - this.free.y)
      if (d < best) { best = d; at = run + t * len }
      run += len
    })
    this.dist = at
  }

  private snapshot(): RobotSnapshot {
    if (this.manual) return { pose: { ...this.free }, telemetry: this.telemetry() }
    const pts = this.layout.waypoints
    let d = this.dist
    let i = 0
    while (d > this.segLen[i]) d -= this.segLen[i++]
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    const t = this.segLen[i] ? d / this.segLen[i] : 0
    return {
      pose: { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, heading: Math.atan2(b[1] - a[1], b[0] - a[0]) },
      telemetry: this.telemetry(),
    }
  }

  private telemetry() {
    return { battery: Math.round(this.battery), signal: 'Strong', failsafe: 'Okay', system: 'Okay' } as const
  }
}
