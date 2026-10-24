import { useDashboard } from '../state/store'
import './zoom.css'

export function ZoomSlider() {
  const zoom = useDashboard((s) => s.zoom)
  const setZoom = useDashboard((s) => s.setZoom)
  return (
    <div className="zoom">
      <button onClick={() => setZoom(zoom + 0.1)} aria-label="Zoom in">+</button>
      <input type="range" min={0} max={1} step={0.01} value={zoom} onChange={(e) => setZoom(+e.target.value)} aria-label="Zoom" />
      <button onClick={() => setZoom(zoom - 0.1)} aria-label="Zoom out">−</button>
    </div>
  )
}
