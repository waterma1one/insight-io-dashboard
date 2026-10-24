import { create } from 'zustand'

export type ViewId = 'map' | 'camera'
export type Mode = 'auto' | 'manual'

interface DashboardState {
  mainView: ViewId
  mode: Mode
  paused: boolean
  zoom: number
  setMode: (mode: Mode) => void
  togglePaused: () => void
  setZoom: (zoom: number) => void
  swapView: () => void
}

export const useDashboard = create<DashboardState>((set) => ({
  mainView: 'map',
  mode: 'auto',
  paused: false,
  zoom: 0.5,
  setMode: (mode) => set({ mode }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  setZoom: (zoom) => set({ zoom: Math.min(1, Math.max(0, zoom)) }),
  // TODO(user): decide how swapView should behave on rapid repeat clicks
  // (e.g. ignore while a transition is running) and whether zoom is per-view.
  swapView: () => set((s) => ({ mainView: s.mainView === 'map' ? 'camera' : 'map' })),
}))
