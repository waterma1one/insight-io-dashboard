export type RGB = [number, number, number]

// TODO(user): choose the height-to-colour banding for the top-down map.
// z is metres above the floor. The demo reads as: free floor near-white,
// low obstacles mid-grey, walls/tall structure black. Return 0..1 channels.
// This default is a working starting point -- tune the thresholds and colours.
export function heightColor(z: number): RGB {
  if (z < 0.08) return [1, 1, 1] // floor
  if (z < 2.5) return [0.45, 0.47, 0.5] // clutter, racks, pallets
  return [0.04, 0.05, 0.07] // walls
}
