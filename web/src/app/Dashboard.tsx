import { useDashboard } from '../state/store'
import { SideNav } from '../components/SideNav'
import { StatusPill } from '../components/StatusPill'
import { PillButton } from '../components/PillButton'
import { TelemetryBar } from '../components/TelemetryBar'
import { ModeToggle } from '../components/ModeToggle'
import { EmergencyStop } from '../components/EmergencyStop'
import { TeleopPad } from '../components/TeleopPad'
import { ZoomSlider } from '../components/ZoomSlider'
import './dashboard.css'

const LABEL = { map: 'Map View', camera: 'Camera View' } as const

export function Dashboard() {
  const mainView = useDashboard((s) => s.mainView)
  const swapView = useDashboard((s) => s.swapView)
  const other = mainView === 'map' ? 'camera' : 'map'
  return (
    <div className="dash">
      <SideNav />
      {/* Both views stay mounted; slot class decides stage vs PiP (see views/ in S2). */}
      <div className={`slot slot--${mainView === 'map' ? 'stage' : 'pip'}`} data-view="map">map</div>
      <div className={`slot slot--${mainView === 'camera' ? 'stage' : 'pip'}`} data-view="camera">camera</div>
      <button className="pip-hit" onClick={swapView} aria-label={`Enter ${other} view`}>Click to enter {other} view</button>

      <div className="hud hud--tl"><StatusPill /><PillButton label="Quick goal" /></div>
      <TelemetryBar label={LABEL[mainView]} />
      <div className="hud hud--tr"><ModeToggle /><PillButton label="Initiate" /></div>
      <div className="hud hud--bl"><ZoomSlider /></div>
      <div className="hud hud--br"><EmergencyStop /><TeleopPad /></div>
    </div>
  )
}
