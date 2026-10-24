import { beforeEach, describe, expect, it } from 'vitest'
import { useDashboard } from './store'

describe('dashboard store', () => {
  beforeEach(() => useDashboard.setState({ mainView: 'map', zoom: 0.2, mode: 'auto', paused: false }))

  it('swaps main view back and forth', () => {
    useDashboard.getState().swapView()
    expect(useDashboard.getState().mainView).toBe('camera')
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
})
