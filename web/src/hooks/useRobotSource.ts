import { useEffect, useRef } from 'react'
import { loadLayout } from '../data/layout'
import { StaticSource } from '../data/staticSource'
import { useDashboard } from '../state/store'

// Starts the robot data source and mirrors its snapshots (and the pause flag) into the store.
export function useRobotSource() {
  const paused = useDashboard((s) => s.paused)
  const manual = useDashboard((s) => s.mode === 'manual')
  const command = useDashboard((s) => s.command)
  const sourceRef = useRef<StaticSource>(undefined)

  useEffect(() => {
    let source: StaticSource | undefined
    let cancelled = false
    loadLayout().then((layout) => {
      if (cancelled) return
      source = new StaticSource(layout)
      const st = useDashboard.getState()
      source.setPaused(st.paused)
      source.setManual(st.mode === 'manual')
      source.setCommand(st.command)
      source.start((snap) => useDashboard.getState().setSnapshot(snap.pose, snap.telemetry))
      sourceRef.current = source
    }).catch(console.error)
    return () => { cancelled = true; source?.stop(); sourceRef.current = undefined }
  }, [])

  useEffect(() => { sourceRef.current?.setPaused(paused) }, [paused])
  useEffect(() => { sourceRef.current?.setManual(manual) }, [manual])
  useEffect(() => { sourceRef.current?.setCommand(command) }, [command])
}
