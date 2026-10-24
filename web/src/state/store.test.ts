import { beforeEach, describe, expect, it } from 'vitest'
import { useDashboard } from './store'

describe('dashboard store', () => {
  beforeEach(() => useDashboard.setState({ mainView: 'map', zoom: 0.2, mode: 'auto', paused: false, estopped: false, lastSwapAt: 0 }))

  it('swaps main view back and forth', () => {
    useDashboard.getState().swapView()
    expect(useDashboard.getState().mainView).toBe('camera')
    useDashboard.setState({ lastSwapAt: 0 }) // as if the transition had finished
    useDashboard.getState().swapView()
    expect(useDashboard.getState().mainView).toBe('map')
  })
  it('clamps zoom to 0..1', () => {
    useDashboard.getState().setZoom(5)
    expect(useDashboard.getState().zoom).toBe(1)
    useDashboard.getState().setZoom(-1)
    expect(useDashboard.getState().zoom).toBe(0)
  })
  it('toggles pause', () => {
    useDashboard.getState().togglePaused()
    expect(useDashboard.getState().paused).toBe(true)
  })
  it('arms quick goal and disarms once a goal is placed', () => {
    useDashboard.setState({ goal: null, goalArmed: false })
    useDashboard.getState().toggleGoalArmed()
    expect(useDashboard.getState().goalArmed).toBe(true)
    useDashboard.getState().setGoal([3, 4])
    expect(useDashboard.getState().goal).toEqual([3, 4])
    expect(useDashboard.getState().goalArmed).toBe(false)
  })
  it('initiate resumes in auto mode', () => {
    useDashboard.setState({ mode: 'manual', paused: true })
    useDashboard.getState().initiate()
    expect(useDashboard.getState().mode).toBe('auto')
    expect(useDashboard.getState().paused).toBe(false)
  })
  it('ignores a second swap inside the transition window', () => {
    useDashboard.getState().swapView()
    useDashboard.getState().swapView()
    expect(useDashboard.getState().mainView).toBe('camera')
  })
  it('e-stop halts, forces manual and locks controls', () => {
    useDashboard.getState().toggleEstop()
    const s = useDashboard.getState()
    expect(s.estopped && s.paused && s.mode === 'manual').toBe(true)
    s.initiate(); s.setMode('auto'); s.togglePaused()
    expect(useDashboard.getState()).toMatchObject({ mode: 'manual', paused: true })
  })
  it('releasing e-stop does not resume until initiate', () => {
    useDashboard.getState().toggleEstop()
    useDashboard.getState().toggleEstop()
    expect(useDashboard.getState()).toMatchObject({ estopped: false, paused: true })
    useDashboard.getState().initiate()
    expect(useDashboard.getState()).toMatchObject({ mode: 'auto', paused: false })
  })
})
