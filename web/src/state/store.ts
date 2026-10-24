import { create } from 'zustand'
import type { Pose, Telemetry } from '../data/source'

export type ViewId = 'map' | 'camera'
export type Mode = 'auto' | 'manual'

interface DashboardState {
  mainView: ViewId
  mode: Mode
  paused: boolean
  zoom: number
  pose: Pose | null
  goal: [number, number] | null
  goalArmed: boolean
  telemetry: Telemetry
  setSnapshot: (pose: Pose, telemetry: Telemetry) => void
  setMode: (mode: Mode) => void
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
  goal: null,
  goalArmed: false,
  telemetry: { battery: 100, signal: 'Strong', failsafe: 'Okay', system: 'Okay' },
  // Pose arrives every frame; keep the old telemetry object unless a field changed so its subscribers stay quiet.
  setSnapshot: (pose, telemetry) =>
    set((s) => ({
      pose,
      telemetry: (Object.keys(telemetry) as (keyof Telemetry)[]).every((k) => s.telemetry[k] === telemetry[k]) ? s.telemetry : telemetry,
    })),
  setMode: (mode) => set({ mode }),
  toggleGoalArmed: () => set((s) => ({ goalArmed: !s.goalArmed })),
  // Placing a goal disarms Quick Goal so a stray click afterwards does nothing.
  setGoal: (goal) => set({ goal, goalArmed: false }),
  // Initiate (re)starts the mission: autonomous, running.
  initiate: () => set({ mode: 'auto', paused: false }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  setZoom: (zoom) => set({ zoom: Math.min(1, Math.max(0, zoom)) }),
  // TODO(user): decide how swapView should behave on rapid repeat clicks
  // (e.g. ignore while a transition is running) and whether zoom is per-view.
  swapView: () => set((s) => ({ mainView: s.mainView === 'map' ? 'camera' : 'map' })),
}))
