const ADJ = ['Amber', 'Brisk', 'Cobalt', 'Crisp', 'Distant', 'Ember', 'Gentle', 'Hidden', 'Idle', 'Lucid', 'Machine', 'Mellow', 'Nimble', 'Neon', 'Open', 'Pale', 'Quiet', 'Rapid', 'Silent', 'Silver', 'Slow', 'Stellar', 'Swift', 'Tidal', 'Vivid', 'Wild']
const NOUN = ['Vision', 'Tensor', 'Signal', 'Lattice', 'Beacon', 'Falcon', 'Harbor', 'Kernel', 'Meadow', 'Quartz', 'Ripple', 'Vector', 'Willow', 'Compass', 'Canvas', 'Delta', 'Echo', 'Forge', 'Garden', 'Horizon', 'Lantern', 'Matrix', 'Orbit', 'Pixel', 'River', 'Summit']
const pick = <T,>(a: T[]) => a[crypto.getRandomValues(new Uint32Array(1))[0] % a.length]

/** A friendly random username like MachineVision47. Suggested at signup, never derived from the email. */
export function randomUsername() {
  return `${pick(ADJ)}${pick(NOUN)}${String(crypto.getRandomValues(new Uint32Array(1))[0] % 100).padStart(2, '0')}`
}
