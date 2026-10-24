import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RosSource, yawFromQuaternion } from './rosSource'
import type { RobotSnapshot } from './source'

class FakeSocket {
  static OPEN = 1
  static last: FakeSocket
  readyState = FakeSocket.OPEN
  sent: any[] = []
  onopen?: () => void
  onmessage?: (e: { data: string }) => void
  onclose?: () => void
  url: string
  constructor(url: string) { this.url = url; FakeSocket.last = this }
  send(data: string) { this.sent.push(JSON.parse(data)) }
  close() { this.onclose?.() }
  receive(msg: object) { this.onmessage?.({ data: JSON.stringify({ op: 'publish', ...msg }) }) }
  twists() { return this.sent.filter((m) => m.op === 'publish' && m.topic === '/cmd_vel') }
}

const odom = (x: number, y: number, yaw: number) => ({
  topic: '/odom',
  msg: { pose: { pose: { position: { x, y }, orientation: { x: 0, y: 0, z: Math.sin(yaw / 2), w: Math.cos(yaw / 2) } } } },
})

describe('RosSource', () => {
  let seen: RobotSnapshot[]
  let source: RosSource
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('WebSocket', FakeSocket)
    seen = []
    source = new RosSource('ws://robot:9090')
    source.start((s) => seen.push(s))
    FakeSocket.last.onopen?.()
  })
  afterEach(() => { source.stop(); vi.useRealTimers(); vi.unstubAllGlobals() })

  it('subscribes to odometry and battery and advertises cmd_vel', () => {
    const topics = FakeSocket.last.sent.map((m) => `${m.op}:${m.topic}`)
    expect(topics).toEqual(['subscribe:/odom', 'subscribe:/battery_state', 'advertise:/cmd_vel'])
  })

  it('maps odometry to pose and battery 0..1 to percent', () => {
    FakeSocket.last.receive({ topic: '/battery_state', msg: { percentage: 0.8 } })
    FakeSocket.last.receive(odom(3, -2, Math.PI / 2))
    const { pose, telemetry } = seen.at(-1)!
    expect(pose.x).toBe(3)
    expect(pose.y).toBe(-2)
    expect(pose.heading).toBeCloseTo(Math.PI / 2)
    expect(telemetry.battery).toBeCloseTo(80)
    expect(telemetry.signal).toBe('Strong')
  })

  it('reports signal Lost when odometry goes stale', () => {
    FakeSocket.last.receive(odom(0, 0, 0))
    vi.advanceTimersByTime(3000)
    expect(seen.at(-1)!.telemetry.signal).toBe('Lost')
  })

  it('stays silent in AUTO so the robot navigates itself', () => {
    vi.advanceTimersByTime(500)
    expect(FakeSocket.last.twists()).toHaveLength(0)
  })

  it('publishes the scaled drive command in MANUAL', () => {
    source.setManual(true)
    source.setCommand({ linear: 1, angular: -0.5 })
    vi.advanceTimersByTime(100)
    const { linear, angular } = FakeSocket.last.twists()[0].msg
    expect(linear.x).toBeCloseTo(1.8)
    expect(angular.z).toBeCloseTo(-1)
  })

  it('publishes zero velocity while paused, even in MANUAL', () => {
    source.setManual(true)
    source.setCommand({ linear: 1, angular: 1 })
    source.setPaused(true)
    vi.advanceTimersByTime(100)
    const { linear, angular } = FakeSocket.last.twists()[0].msg
    expect(linear.x).toBe(0)
    expect(angular.z).toBe(0)
  })

  it('reconnects after the socket closes', () => {
    const first = FakeSocket.last
    first.close()
    vi.advanceTimersByTime(2000)
    expect(FakeSocket.last).not.toBe(first)
  })
})

describe('yawFromQuaternion', () => {
  it('recovers a planar yaw', () => {
    expect(yawFromQuaternion({ x: 0, y: 0, z: Math.sin(0.4), w: Math.cos(0.4) })).toBeCloseTo(0.8)
  })
})
