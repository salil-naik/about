# Starship Flight Atlas

React and Three.js replay of the first 15 integrated Starship flights.

## Run from the website root

```sh
npm install
npm run dev
```

`npm run build` creates the atlas at `dist/starship/index.html`. Run `npm run test:starship` for the replay and science checks.

## Position data

Flights 13, 14, and 15 use latitude, longitude, altitude, and timestamp samples archived by [StarDash](https://stardash.live/archive) from the [public SpaceX telemetry feed](https://stardash.live/source-docs). The local files are in `src/data/`. The source CSV for each is linked in the application. All recorded tracks use monotone cubic interpolation, preserving the recorded fixes while smoothing velocity across sample boundaries. Samples are connected only across gaps of 90 seconds or less; the ship holds its last fix across larger gaps. `mission-provenance.json` records the source CSV checksum and comparison of all 2,630 cached fixes.

Flights 1–12 now use webcast altitude, speed and engine observations; their horizontal geography remains estimated. Booster altitude profiles use the available webcast observations, with reconstructed return geometry. Flight 9 has no archived booster return measurements, so that return remains an explicit reconstruction. In the shared globe renderer, Earth, vehicles, tower and celestial bodies share a physical distance scale. Vehicle attitude is reconstructed rather than measured. The opening rise and final catch timing are reconstructed from the available fixes and published milestones. The booster initially inherits the rendered tilted stack's position and velocity, then follows an illustrative offshore return. Its endpoint is illustrative sea-level contact at the scheduled recovery time, not an observation of the loss. The vehicle fades out when this reconstruction ends. SpaceX's listed event times are approximate. Labels distinguish those reconstructions from recorded ship positions.

This is a visualization prototype, not a navigation or flight-analysis tool.

### Starbase map data and cinematic pacing

The close-up globe uses `src/data/starbase-osm.json`, a bundled extract from
OpenStreetMap's API, centered at 25.99683 N, 97.158038 W. The extract includes
source URL, OSM way IDs, tags, origin, and attribution. Map data is © OpenStreetMap
contributors, licensed under ODbL 1.0: https://www.openstreetmap.org/copyright.
There are no live map requests during playback. Buildings without mapped heights
use an illustrative 6 m height; underground structures are omitted. The active
launch/catch tower is a separate moving model; the current scenery is representative
for historical launches rather than a survey of the site on each launch date.

All 15 flights use the same globe experience, mission picker, transparent transport,
and per-flight route, outcomes and launch epoch. Flights 1–12 display webcast measurements and explicitly estimated ground tracks; Flights 13–15 preserve archived ship positions.
Flight 1 stays attached, ascent losses end without a simulated landing, and booster
catch flights return to the tower. Historical vehicle dimensions and recovery hardware are representative. Flight 13 preserves its final cached 223 m fix and appends a labeled 30-second estimated descent; Flight 14 preserves its final cached fix and adds an estimated water-contact/settling animation.

Automatic pacing in `src/missionModel.js` runs launch at 10×, slows separation
to 1× and then 5×, gives the pullback a short 25× transition, and cruises at 600×.
Orbital insertion, payload deployment, return checks and deorbit do not interrupt
that cruise speed. Entry runs at 100×; final ship returns slow to 10×, or 1× for
Flight 15's catch. Its automatic replay takes about 213 seconds plus a 2.1-second
opening approach. Manual speed selection overrides automatic pacing; replay
restores it. The event-spaced timeline is not a linear mission-time scale.

The opening view shows the globe before easing into a stationary launch pad, then
starting the clock. Close shots track the vehicle position immediately so camera
smoothing cannot leave the rocket behind. Position, framing and atmosphere blend
continuously through the ascent into the orbital overview. Follow controls sit
above the right side of the transport, with upright vehicle symbols; the map
locator stays upright as the vehicle changes attitude.

### Astronomy and scientific limits

`missionAstronomy.js` uses Astronomy Engine 2.1.19 for geometric Sun and Moon
positions, transformed from J2000 through precession/nutation and Greenwich
apparent sidereal time into the globe's Earth-fixed frame. Each replay uses its launch UTC from the bundled Launch Library catalog
(`src/data/launch-epochs.json`); the Flight 15 epoch is 2026-11-13 22:47:36 UTC. UTC approximates UT1; atmospheric refraction and
light-time corrections are not applied. Earth is a 6,371 km mean-radius sphere,
not a survey ellipsoid. The Moon radius is 1,737.4 km; the Sun radius is 695,700 km.
Both remain at physical distance and angular size, and can be outside the frame
or occluded by Earth. Earth and lunar terminators use the same Sun vector.

`horizons-reference.json` contains five independent geocentric JPL DE441 vector
samples spanning 24 hours, with the full Horizons query parameters. Tests compare
angular direction and distance against those samples and check topocentric
bearings, lunar illumination, physical scale and coordinate transforms. Observed
maximum direction differences are about 1.9 arcseconds for the Moon and 0.8
arcseconds for the Sun. These bounds describe this replay window, not a general
precision guarantee.

Earth/local geometry, celestial bodies and stars use separate depth passes with
the same perspective to retain metre-scale precision near the pad. Camera travel
is limited to the Earth neighborhood so Earth correctly occludes the distant
bodies. The Moon surface is simplified; terrain, atmospheric effects, star
visibility and outline contrast are artistic enhancements. Hawaiʻi (United
States) and Chile overlays identify scheduled return-check regions, not exact
landing sites or the current position of Starship. No country borders are drawn.

Vehicle models in `VehicleModels.jsx` are original procedural geometry with curved
nose profiles, representative flaps, engine bells and three Super Heavy grid fins.
Dimensions remain in metres; hardware placement, thermal protection, surface
finish and exhaust are representative artwork rather than exact flight CAD.
Material fill is enhanced so the silhouette remains readable on its shaded side.
Camera pullback uses geometric distance interpolation; follow-target changes ease
over 1.8 seconds. The transparent transport remains unchanged.

### Verification

```sh
npm test
npm run build
```

The tests cover all 15 mission models, uninterrupted orbital pacing, close-camera
tracking, frame-rate independence, ephemerides, source-fix
preservation, interpolation continuity, separation scale, the two-metre-high
opening observer and physically placed celestial views. Browser review on 2026-11-21 covered the ground-level launch, staged orbital
pullback, separation, booster follow/return, final catch, Chile/Hawaiʻi overlays
and the physically scaled lunar crescent. This review also caught and corrected
live shader-uniform updates that numerical ephemeris tests cannot verify.

### Coastal scenery and catch support

The launch/catch close-up paints the bundled OSM shoreline, wetland, water,
scrub and road geometry onto a curved local terrain mesh. The shoreline's end
tangents extend the scenery beyond the mapped extract; those extensions and
soil grain are illustrative. Storage tanks use their mapped footprints, with
representative cylindrical forms where their equipment layout is not surveyed.

Near-surface sky, haze and sky fill fade with camera altitude. Direct light and
shadows retain the ephemeris Sun direction; haze, vapor, exhaust glow and surface
materials are artistic approximations, not reconstructed weather. The atmosphere
is a separate background render pass, so it cannot wash over opaque vehicles.

Starship's two representative lifting pins meet separate upper-body catch rails.
The barrel clears the rails and the engine section hangs below them. A geometric
regression check verifies rail clearance, pin contact height and arm reach using
the final ship position. Pin dimensions and carriage motion are illustrative.
At globe scale, an upright rocket-in-ring symbol locates each vehicle;
it is a map annotation, not an enlarged physical vehicle.

### Historical telemetry and recovery provenance

`src/data/historical/flight1.json` through `flight12.json` contain numerical
observations extracted from SpaceX webcast HUDs by Rafael Adamy / Starship
Telemetry (`https://telemetry.starshipspaceprogram.com/`). Each file records its
versioned source URL, SHA-256 of the original download, retrieval date, units,
limitations, source intervals and event-detection candidates. Speed is decimated
to the first original interval per mission-second bucket; its value and original
timestamp remain unchanged. Altitude and engine-count intervals are retained.
No source simulator code, generated trajectory or 3D assets are reused.

`historicalTelemetry.js` fits monotone curves through quantized altitude changes
and integrates horizontal speed from the webcast speed and the fitted vertical
velocity. The assumed 98.5-degree launch heading and final corridor corrections
are model assumptions. Recovery locations are constrained to the approximate
locations in Jonathan McDowell's 2024/2025 catalogs where available; conservative
50–300 km display radii are artistic uncertainty envelopes, not statistical
confidence intervals. Flight 12 uses a broader 800 km estimated region. Source
links are in Mission details. The dashed path is never labeled measured GPS.

The raw telemetry display leaves unavailable readings blank. Gaps may be fitted
or held for animation and are labeled. Engine counts known to conflict with a
confirmed powered landing (Flights 4, 5 and 10) are rejected in that phase.
Source records can contain clock offsets, misreads, frozen readouts and postflight
artefacts; the record's final timestamp is not proof of touchdown or destruction.

SpaceX postflight reports verify mission outcomes and selected times. Flight 4's
booster splashdown (7:24) and Flight 5's ship splashdown (1:05:40) use the reported
times. Flights 10/11 use cataloged touchdown UTCs converted with their launch
epochs. Other reported times retain approximate labels; archive-detected events
remain webcast-derived. Cutoff indications that appear after staging are rejected
as contradictory and reconciled with the approximate plan under an estimated label; and unresolved burn/contact times remain estimated.
SpaceX's published plans for Flights 10–12 are retained separately for comparison,
never presented as observed occurrence times. This is source verification, not a
claim that every webcast value has been independently validated frame by frame.

`Splashdown.jsx` renders a curved ocean patch, subtle wave texture, contact
spray and expanding rings at the recovery location. Controlled landings settle
sideways over twelve seconds. Hard impacts use a sharper plume and fading body;
loss-of-signal flights stop above Earth and do not invent a water landing.
The ship's orbital cruise still stays at 600×. Explicitly following the booster
slows its final recovery shot; manual speed overrides this. Waves, spray,
terminal attitude and flotation are illustrative and freeze with mission time.
