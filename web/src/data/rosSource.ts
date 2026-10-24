import type { DriveCommand, Pose, RobotSnapshot, RobotSource, Telemetry } from './source'

const CMD_RATE_MS = 100 // Twist publish rate while the dashboard owns the robot
const RECONNECT_MS = 2000
const STALE_MS = 2000 // no odometry for this long -> signal Lost
const MAX_LINEAR = 1.8 // m/s at full stick, same as the static replay
const MAX_ANGULAR = 2 // rad/s at full stick

interface Quaternion { x: number; y: number; z: number; w: number }

export function yawFromQuaternion(q: Quaternion): number {
  return Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z))
}

// Talks the rosbridge JSON protocol directly over a WebSocket (no roslib dependency).
// Subscribes to /odom and /battery_state; publishes /cmd_vel while paused or in MANUAL, and stays
// silent in AUTO so the robot's own navigation drives. Reconnects automatically if the bridge drops.
export class RosSource implements RobotSource {
  private ws?: WebSocket
  private onUpdate: (snap: RobotSnapshot) => void = () => {}
  private stopped = true
  private paused = false
  private manual = false
  private cmd: DriveCommand = { linear: 0, angular: 0 }
  private pose: Pose = { x: 0, y: 0, heading: 0 }
  private battery = 100
  private lastOdom = 0
  private cmdTimer?: ReturnType<typeof setInterval>
  private retryTimer?: ReturnType<typeof setTimeout>
  private staleTimer?: ReturnType<typeof setInterval>
  private readonly url: string

  constructor(url: string) { this.url = url }

  start(onUpdate: (snap: RobotSnapshot) => void) {
    this.onUpdate = onUpdate
    this.stopped = false
    this.connect()
    this.cmdTimer = setInterval(() => this.publishCommand(), CMD_RATE_MS)
    this.staleTimer = setInterval(() => this.emit(), 500)
  }

  stop() {
    this.stopped = true
    clearInterval(this.cmdTimer)
    clearInterval(this.staleTimer)
    clearTimeout(this.retryTimer)
    this.ws?.close()
  }

  setPaused(paused: boolean) { this.paused = paused }
  setManual(on: boolean) { this.manual = on }
  setCommand(cmd: DriveCommand) { this.cmd = cmd }

  private connect() {
    const ws = new WebSocket(this.url)
    this.ws = ws
    ws.onopen = () => {
      this.send({ op: 'subscribe', topic: '/odom', type: 'nav_msgs/Odometry' })
      this.send({ op: 'subscribe', topic: '/battery_state', type: 'sensor_msgs/BatteryState' })
      this.send({ op: 'advertise', topic: '/cmd_vel', type: 'geometry_msgs/Twist' })
    }
    ws.onmessage = (e) => this.handle(JSON.parse(String(e.data)))
    ws.onclose = () => {
      if (!this.stopped) this.retryTimer = setTimeout(() => this.connect(), RECONNECT_MS)
    }
  }

  private handle(m: { op?: string; topic?: string; msg?: any }) {
    if (m.op !== 'publish' || !m.msg) return
    if (m.topic === '/odom') {
      const p = m.msg.pose.pose
      this.pose = { x: p.position.x, y: p.position.y, heading: yawFromQuaternion(p.orientation) }
      this.lastOdom = Date.now()
      this.emit()
    } else if (m.topic === '/battery_state') {
      this.battery = m.msg.percentage * 100 // BatteryState reports 0..1
    }
  }

  private emit() {
    const age = Date.now() - this.lastOdom
    const telemetry: Telemetry = {
      battery: this.battery,
      signal: this.lastOdom === 0 || age > STALE_MS ? 'Lost' : 'Strong',
      failsafe: 'Okay',
      system: 'Okay',
    }
    this.onUpdate({ pose: this.pose, telemetry })
  }

  private publishCommand() {
    if (!this.paused && !this.manual) return
    const c = this.manual && !this.paused ? this.cmd : { linear: 0, angular: 0 }
    this.send({
      op: 'publish',
      topic: '/cmd_vel',
      msg: {
        linear: { x: c.linear * MAX_LINEAR, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: c.angular * MAX_ANGULAR },
      },
    })
  }

  private send(payload: object) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(payload))
  }
}
