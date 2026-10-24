import { useEffect, useRef } from 'react'
import { loadLayout } from '../data/layout'
import { RosSource } from '../data/rosSource'
import type { RobotSource } from '../data/source'
import { StaticSource } from '../data/staticSource'
import { useDashboard } from '../state/store'

// VITE_ROBOT_SOURCE=ros streams from rosbridge (VITE_ROSBRIDGE_URL); anything else replays the static route.
async function createSource(): Promise<RobotSource> {
  if (import.meta.env.VITE_ROBOT_SOURCE === 'ros') {
    return new RosSource(import.meta.env.VITE_ROSBRIDGE_URL ?? 'ws://localhost:9090')
  }
  return new StaticSource(await loadLayout())
}

// Starts the robot data source and mirrors its snapshots (and the pause flag) into the store.
export function useRobotSource() {
  const paused = useDashboard((s) => s.paused)
  const manual = useDashboard((s) => s.mode === 'manual')
  const command = useDashboard((s) => s.command)
  const sourceRef = useRef<RobotSource>(undefined)

  useEffect(() => {
    let source: RobotSource | undefined
    let cancelled = false
    createSource().then((created) => {
      if (cancelled) return
      source = created
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
