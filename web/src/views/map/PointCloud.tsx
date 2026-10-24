import { useEffect, useMemo } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { PCDLoader } from 'three/addons/loaders/PCDLoader.js'
import { BufferAttribute } from 'three'
import { ASSETS } from '../../data/layout'
import { heightColor } from './heightColor'

export function PointCloud() {
  const cloud = useLoader(PCDLoader, ASSETS.pcd)

  // Colour by height once, then draw top-down. Higher points render last so walls win over floor.
  const sorted = useMemo(() => {
    const pos = cloud.geometry.getAttribute('position')
    const colors = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) colors.set(heightColor(pos.getZ(i)), i * 3)
    cloud.geometry.setAttribute('color', new BufferAttribute(colors, 3))
    return cloud
  }, [cloud])

  useEffect(() => {
    const m = sorted.material as unknown as { vertexColors: boolean; size: number; sizeAttenuation: boolean; depthTest: boolean; needsUpdate: boolean }
    m.vertexColors = true
    m.sizeAttenuation = false
    m.needsUpdate = true
  }, [sorted])

  // Keep splats just wider than the 0.15 m floor spacing at any zoom, so the floor reads solid
  // on the stage and walls stay crisp in the small PiP.
  useFrame(({ camera }) => {
    const size = Math.max(1.6, camera.zoom * 0.35)
    const m = sorted.material as unknown as { size: number }
    if (Math.abs(m.size - size) > 0.05) m.size = size
  })

  return <primitive object={sorted} />
}
