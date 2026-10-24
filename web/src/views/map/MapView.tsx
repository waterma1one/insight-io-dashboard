import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { MapControls } from '@react-three/drei'
import type { OrthographicCamera } from 'three'
import { useDashboard } from '../../state/store'
import { loadLayout, type Layout } from '../../data/layout'
import { PointCloud } from './PointCloud'
import { ZoneOverlay } from './ZoneOverlay'
import { RobotIcon, HeadingArrow, GoalPin } from './RobotMarker'
import { LabelProjector, type MapLabel } from './LabelLayer'
import './map.css'

// Slider 0..1 maps to camera zoom in px-per-metre. Log scale feels linear to the thumb.
const ZOOM_MIN = 6
const ZOOM_MAX = 60
const toCameraZoom = (v: number) => ZOOM_MIN * (ZOOM_MAX / ZOOM_MIN) ** v
const toSlider = (z: number) => Math.log(z / ZOOM_MIN) / Math.log(ZOOM_MAX / ZOOM_MIN)

function CameraRig({ layout, interactive }: { layout: Layout; interactive: boolean }) {
  const camera = useThree((s) => s.camera) as OrthographicCamera
  const size = useThree((s) => s.size)
  const zoom = useDashboard((s) => s.zoom)
  const setZoom = useDashboard((s) => s.setZoom)
  const lastWritten = useRef(zoom)

  // PiP shows the whole map; the stage view follows the slider.
  useEffect(() => {
    if (interactive) {
      camera.zoom = toCameraZoom(zoom)
    } else {
      const { minX, maxX, minY, maxY } = layout.bounds
      camera.zoom = Math.min(size.width / (maxX - minX + 4), size.height / (maxY - minY + 4))
      camera.position.set(0, 0, 50)
    }
    camera.updateProjectionMatrix()
  }, [camera, size, zoom, interactive, layout])

  // Wheel / pinch zoom -> slider
  useEffect(() => {
    if (!interactive) return
    let raf = 0
    const tick = () => {
      const v = Math.min(1, Math.max(0, toSlider(camera.zoom)))
      if (Math.abs(v - lastWritten.current) > 0.002) {
        lastWritten.current = v
        setZoom(v)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [camera, interactive, setZoom])

  return interactive ? <MapControls enableRotate={false} screenSpacePanning makeDefault /> : null
}

// Invisible floor plane: while Quick Goal is armed, a click (not a drag-pan) drops the goal there.
function GoalPicker() {
  const armed = useDashboard((s) => s.goalArmed)
  const setGoal = useDashboard((s) => s.setGoal)
  if (!armed) return null
  return (
    <mesh position={[0, 0, 1]} onClick={(e) => { e.stopPropagation(); setGoal([e.point.x, e.point.y]) }}>
      <planeGeometry args={[1000, 1000]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  )
}

export function MapView({ interactive }: { interactive: boolean }) {
  const [layout, setLayout] = useState<Layout | null>(null)
  const els = useRef<(HTMLDivElement | null)[]>([])
  useEffect(() => { loadLayout().then(setLayout).catch(console.error) }, [])

  const labels = useMemo<MapLabel[]>(() => {
    if (!layout) return []
    const zoneLabels = interactive
      ? layout.zones.map((z) => ({
          id: z.name,
          position: [z.polygon.reduce((a, p) => a + p[0], 0) / z.polygon.length, z.polygon.reduce((a, p) => a + p[1], 0) / z.polygon.length] as [number, number],
          node: <span className="zone-label">{z.name}</span>,
        }))
      : []
    const robotAt = () => { const p = useDashboard.getState().pose; return p ? [p.x, p.y] as [number, number] : null }
    return [...zoneLabels, {
      id: 'heading',
      position: layout.waypoints[0],
      follow: robotAt,
      angle: () => useDashboard.getState().pose?.heading ?? 0,
      node: <HeadingArrow />,
    }, {
      id: 'robot',
      position: layout.waypoints[0],
      follow: robotAt,
      node: <RobotIcon />,
    }, {
      id: 'goal',
      position: [0, 0],
      follow: () => useDashboard.getState().goal,
      node: <GoalPin />,
    }]
  }, [layout, interactive])

  if (!layout) return <div className="map-loading">Loading map…</div>

  return (
    <div className={`map ${interactive ? 'map--live' : ''}`}>
      <Canvas orthographic camera={{ position: [0, 0, 50], zoom: 20, near: 0.1, far: 200 }} gl={{ antialias: true }}>
        <color attach="background" args={['#d4d4d2']} />
        <CameraRig layout={layout} interactive={interactive} />
        <Suspense fallback={null}>
          <PointCloud />
        </Suspense>
        <ZoneOverlay zones={layout.zones} />
        {interactive && <GoalPicker />}
        <LabelProjector labels={labels} els={els} />
      </Canvas>
      <div className="map-labels">
        {labels.map((l, i) => <div key={l.id} className="map-label" ref={(el) => { els.current[i] = el }}>{l.node}</div>)}
      </div>
    </div>
  )
}
