import { useDashboard } from '../state/store'
import { SideNav } from '../components/SideNav'
import { StatusPill } from '../components/StatusPill'
import { PillButton } from '../components/PillButton'
import { TelemetryBar } from '../components/TelemetryBar'
import { ModeToggle } from '../components/ModeToggle'
import { EmergencyStop } from '../components/EmergencyStop'
import { TeleopPad } from '../components/TeleopPad'
import { ZoomSlider } from '../components/ZoomSlider'
import { MapView } from '../views/map/MapView'
import { CameraView } from '../views/camera/CameraView'
import { useRobotSource } from '../hooks/useRobotSource'
import { useTeleop } from '../hooks/useTeleop'
import './dashboard.css'

const LABEL = { map: 'Map View', camera: 'Camera View' } as const

export function Dashboard() {
  useRobotSource()
  const teleop = useTeleop()
  const mainView = useDashboard((s) => s.mainView)
  const swapView = useDashboard((s) => s.swapView)
  const goalArmed = useDashboard((s) => s.goalArmed)
  const toggleGoalArmed = useDashboard((s) => s.toggleGoalArmed)
  const initiate = useDashboard((s) => s.initiate)
  const other = mainView === 'map' ? 'camera' : 'map'
  return (
    <div className="dash">
      <SideNav />
      {/* Both views stay mounted; slot class decides stage vs PiP (see views/ in S2). */}
      <div className={`slot slot--${mainView === 'map' ? 'stage' : 'pip'}`} data-view="map"><MapView interactive={mainView === 'map'} /></div>
      <div className={`slot slot--${mainView === 'camera' ? 'stage' : 'pip'}`} data-view="camera"><CameraView /></div>
      <button className="pip-hit" onClick={swapView} aria-label={`Enter ${other} view`}><span>Click to enter {other} view</span></button>

      <div className="hud hud--tl"><StatusPill /><PillButton label={goalArmed ? 'Click map…' : 'Quick goal'} onClick={toggleGoalArmed} /></div>
      <TelemetryBar label={LABEL[mainView]} />
      <div className="hud hud--tr"><ModeToggle /><PillButton label="Initiate" onClick={initiate} /></div>
      <div className="hud hud--bl"><ZoomSlider /></div>
      <div className="hud hud--br"><EmergencyStop /><TeleopPad onPress={teleop.press} onRelease={teleop.release} /></div>
    </div>
  )
}
