import { useEffect, useRef } from 'react'
import { loadLayout } from '../data/layout'
import { StaticSource } from '../data/staticSource'
import { useDashboard } from '../state/store'

// Starts the robot data source and mirrors its snapshots (and the pause flag) into the store.
export function useRobotSource() {
  const paused = useDashboard((s) => s.paused)
  const sourceRef = useRef<StaticSource>(undefined)

  useEffect(() => {
    let source: StaticSource | undefined
    let cancelled = false
    loadLayout().then((layout) => {
      if (cancelled) return
      source = new StaticSource(layout)
      source.setPaused(useDashboard.getState().paused)
      source.start((snap) => useDashboard.getState().setSnapshot(snap.pose, snap.telemetry))
      sourceRef.current = source
    }).catch(console.error)
    return () => { cancelled = true; source?.stop(); sourceRef.current = undefined }
  }, [])

  useEffect(() => { sourceRef.current?.setPaused(paused) }, [paused])
}
