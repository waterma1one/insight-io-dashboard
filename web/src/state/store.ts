import { create } from 'zustand'
import type { DriveCommand, Pose, Telemetry } from '../data/source'

export const SWAP_LOCK_MS = 500 // matches the slot transition in dashboard.css

export type ViewId = 'map' | 'camera'
export type Mode = 'auto' | 'manual'

interface DashboardState {
  mainView: ViewId
  mode: Mode
  paused: boolean
  zoom: number
  pose: Pose | null
  command: DriveCommand
  goal: [number, number] | null
  goalArmed: boolean
  estopped: boolean
  lastSwapAt: number
  telemetry: Telemetry
  setSnapshot: (pose: Pose, telemetry: Telemetry) => void
  setMode: (mode: Mode) => void
  setCommand: (command: DriveCommand) => void
  toggleEstop: () => void
  toggleGoalArmed: () => void
  setGoal: (goal: [number, number]) => void
  initiate: () => void
  togglePaused: () => void
  setZoom: (zoom: number) => void
  swapView: () => void
}

export const useDashboard = create<DashboardState>((set) => ({
  mainView: 'map',
  mode: 'auto',
  paused: false,
  zoom: 0.2,
  pose: null,
  command: { linear: 0, angular: 0 },
  goal: null,
  goalArmed: false,
  estopped: false,
  lastSwapAt: 0,
  telemetry: { battery: 100, signal: 'Strong', failsafe: 'Okay', system: 'Okay' },
  // Pose arrives every frame; keep the old telemetry object unless a field changed so its subscribers stay quiet.
  setSnapshot: (pose, telemetry) =>
    set((s) => ({
      pose,
      telemetry: (Object.keys(telemetry) as (keyof Telemetry)[]).every((k) => s.telemetry[k] === telemetry[k]) ? s.telemetry : telemetry,
    })),
  setMode: (mode) => set((s) => (s.estopped ? s : { mode })),
  setCommand: (command) => set({ command }),
  // E-stop latches: it halts the mission, drops to MANUAL with zero command, and locks out mode,
  // pause, Initiate and the pad. Pressing again releases the latch but does not resume; the operator
  // must hit Initiate, so the robot never restarts by itself.
  toggleEstop: () =>
    set((s) =>
      s.estopped
        ? { estopped: false }
        : { estopped: true, paused: true, mode: 'manual', command: { linear: 0, angular: 0 }, goalArmed: false },
    ),
  toggleGoalArmed: () => set((s) => ({ goalArmed: !s.goalArmed })),
  // Placing a goal disarms Quick Goal so a stray click afterwards does nothing.
  setGoal: (goal) => set({ goal, goalArmed: false }),
  // Initiate (re)starts the mission: autonomous, running.
  initiate: () => set((s) => (s.estopped ? s : { mode: 'auto', paused: false })),
  togglePaused: () => set((s) => (s.estopped ? s : { paused: !s.paused })),
  setZoom: (zoom) => set({ zoom: Math.min(1, Math.max(0, zoom)) }),
  // Both views animate for SWAP_LOCK_MS; a click during that window is ignored so rapid double-clicks
  // cannot flip back mid-transition. Zoom stays global: only the map stage uses the slider.
  swapView: () =>
    set((s) => {
      const now = Date.now()
      if (now - s.lastSwapAt < SWAP_LOCK_MS) return s
      return { mainView: s.mainView === 'map' ? 'camera' : 'map', lastSwapAt: now }
    }),
}))
