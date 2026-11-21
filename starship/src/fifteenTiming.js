// SpaceX's published approximate mission timeline. Booster recovery differed from plan.
const milestones = [
  [-3, 'Super Heavy ignition', 'The booster engines start beneath the launch mount.'],
  [0, 'Liftoff', 'The stack clears Pad 2 at Starbase.'],
  [58, 'Maximum dynamic pressure', 'Aerodynamic loading peaks during ascent.'],
  [139, 'Booster engine cutoff', 'Most booster engines shut down ahead of separation.'],
  [141, 'Hot staging', 'Starship ignites its engines and separates from Super Heavy.'],
  [146, 'Boostback ignition', 'The booster flips and fires its engines toward the coast.'],
  [182, 'Planned boostback cutoff', 'Super Heavy ended its boostback early. This marker shows the scheduled cutoff.'],
  [370, 'Booster landing burn', 'The flight plan placed landing ignition here. Super Heavy performed its landing burn offshore after the catch abort.'],
  [395, 'Planned booster catch', 'SpaceX scheduled the catch for this point. In flight, Super Heavy diverted and was lost offshore. The exact time of loss is unverified.'],
  [489, 'Ship engine cutoff', 'Starship coasts after its ascent burn.'],
  [1570, 'Orbital insertion ignition', 'Starship begins its orbit-raising burn.'],
  [1590, 'Orbital insertion cutoff', 'The insertion burn ends.'],
  [2101, 'Payload deployment begins', 'Starship starts releasing its Starlink V3 payload.'],
  [4660, 'Payload deployment ends', '26 Starlink satellites were deployed during the mission.'],
  [5266, 'Hawaiʻi return decision', 'A scheduled return decision, not a flyover of Hawaiʻi. The camera continues following Starship.'],
  [26135, 'Chile return decision', 'A scheduled return decision, not a flyover of Chile. The camera continues following Starship.'],
  [74515, 'Final Hawaiʻi decision', 'The final scheduled Pacific return decision. Use View Hawaiʻi to inspect the region.'],
  [77757, 'Deorbit ignition', 'Starship fires its engine to leave orbit.'],
  [77767, 'Deorbit cutoff', 'The ship coasts toward atmospheric entry.'],
  [79846, 'Atmospheric entry', 'Starship descends through the upper atmosphere.'],
  [80974, 'Transonic descent', 'Starship approaches the speed of sound.'],
  [81013, 'Subsonic descent', 'The ship slows below the speed of sound.'],
  [81136, 'Ship landing burn', 'The engines relight on final approach.'],
  [81138, 'Landing flip', 'Starship pitches upright for capture.'],
  [81146, 'Two-engine landing', 'The landing burn transitions to two engines.'],
  [81153, 'Single-engine landing', 'One engine remains for the final approach.'],
  [81154, 'Tower catch', 'Mechazilla catches the returning Starship at Starbase.'],
];
// Individual release markers in the StarDash Flight 15 archive. SpaceX
// publishes the deployment window; the individual releases are estimates.
export const releaseTimes = [
  2160, 2255, 2675, 2770, 3190, 3256, 3322, 3404, 3459, 3524, 3596, 3673, 3751,
  3790, 3868, 3946, 3985, 4064, 4142, 4220, 4259, 4337, 4416, 4494, 4533, 4650,
];
export function payloadCount(time) {
  return releaseTimes.findLastIndex(release => release <= time) + 1;
}
const releases = releaseTimes.map((time, index) => ({
  time,
  name: `Starlink ${index + 1} of ${releaseTimes.length}`,
  detail: `The Flight 15 archive places payload release ${index + 1} at this point in the deployment window.`,
  source: 'StarDash estimate',
}));
export const events15 = milestones.map(([time, name, detail]) => ({time, name, detail, source: 'SpaceX schedule'}))
  .concat(releases).sort((a,b) => a.time-b.time);
export const start = -3;
export const end = events15.at(-1).time;
export const windows = [
  ['Full mission', start, end], ['Ascent', start, 489], ['Deployment', 489, 4660],
  ['Orbital coast', 4660, 77757], ['Entry', 77757, 81136], ['Catch', 81136, end]
];
export function clock(t) {
  const s = Math.floor(Math.abs(t));
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(n => String(n).padStart(2,'0')).join(':');
}
