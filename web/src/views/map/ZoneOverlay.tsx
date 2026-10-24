import { useMemo } from 'react'
import { Shape, DoubleSide } from 'three'
import type { Zone } from '../../data/layout'

function ZonePolygon({ zone }: { zone: Zone }) {
  const shape = useMemo(() => new Shape(zone.polygon.map(([x, y]) => ({ x, y }) as never)), [zone])
  return (
    <mesh position={[0, 0, 3.2]}>
      <shapeGeometry args={[shape]} />
      <meshBasicMaterial color="#e8434f" transparent opacity={0.22} side={DoubleSide} depthWrite={false} />
    </mesh>
  )
}

export function ZoneOverlay({ zones }: { zones: Zone[] }) {
  return <>{zones.map((z) => <ZonePolygon key={z.name} zone={z} />)}</>
}
