import './telemetry.css'

export function TelemetryBar({ label }: { label: string }) {
  return (
    <div className="telemetry">
      <div className="telemetry__bar">
        <span className="t-item"><b>100%</b><i className="batt" /></span>
        <span className="t-item"><i className="signal" /><b>Strong</b></span>
        <span className="t-item">Failsafe <b>Okay</b><i className="led" /></span>
        <span className="t-item">System <b>Okay</b><i className="led" /></span>
      </div>
      <div className="telemetry__label">{label}</div>
    </div>
  )
}
