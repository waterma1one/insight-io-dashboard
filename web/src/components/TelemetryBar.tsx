import { useDashboard } from '../state/store'
import './telemetry.css'

export function TelemetryBar({ label }: { label: string }) {
  const t = useDashboard((s) => s.telemetry)
  return (
    <div className="telemetry">
      <div className="telemetry__bar">
        <span className="t-item"><b>{t.battery}%</b><i className="batt" /></span>
        <span className="t-item"><i className="signal" /><b>{t.signal}</b></span>
        <span className="t-item">Failsafe <b>{t.failsafe}</b><i className="led" /></span>
        <span className="t-item">System <b>{t.system}</b><i className="led" /></span>
      </div>
      <div className="telemetry__label">{label}</div>
    </div>
  )
}
