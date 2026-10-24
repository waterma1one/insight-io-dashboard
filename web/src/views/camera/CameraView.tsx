import { ASSETS } from '../../data/layout'
import './camera.css'

export function CameraView() {
  return <video className="camera" src={ASSETS.video} autoPlay loop muted playsInline />
}
