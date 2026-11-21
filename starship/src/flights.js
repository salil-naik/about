// Outcomes and dates are drawn from SpaceX mission pages and the launch catalogue.
// Runtime routes and timings come from the recorded/GPS or webcast-backed mission model.
import flight13Data from './data/flight13.json';
import flight14Data from './data/flight14.json';
import flight15Data from './data/flight15.json';

export const START = { lat: 25.99684, lon: -97.15523 };
export const PAD2 = { lat: 25.99682, lon: -97.15803 };
export const getStart = flight => flight.number >= 12 ? PAD2 : START;
export const recordedShip = { 13: flight13Data, 14: flight14Data, 15: flight15Data };
const mission = (number, date, booster, ship, opts = {}) => ({
  number, date, booster, ship, pad: number >= 12 ? 'Pad 2' : 'Pad 1',
  phase: opts.phase || 'Suborbital test',
  landmark: opts.landmark || '',
  stage: number === 1 ? false : true,
  stageSeconds: opts.stageSeconds || 144,
  boosterSeconds: opts.boosterSeconds || 420,
  route: opts.route || 'indian',
  source: `https://www.spacex.com/launches/starship-flight-${number}`,
  duration: opts.duration || 66,
  note: opts.note || '',
});

export const flights = [
  mission(1, '20 Apr 2023', 'No landing · vehicle lost before separation', 'No landing · vehicle lost before separation', { route: 'early', duration: 4, landmark: 'First integrated launch', note: 'The vehicle did not reach stage separation.' }),
  mission(2, '18 Nov 2023', 'Lost after separation', 'Lost during ascent', { route: 'ascent', duration: 8, landmark: 'First hot staging' }),
  mission(3, '14 Mar 2024', 'Lost above Gulf of Mexico', 'Lost during reentry', { route: 'indian', duration: 50, landmark: 'Ship reached space' }),
  mission(4, '06 Jun 2024', 'Controlled Gulf splashdown', 'Controlled Indian Ocean splashdown', { landmark: 'First ship splashdown' }),
  mission(5, '13 Oct 2024', 'Caught by launch tower', 'Controlled Indian Ocean splashdown', { landmark: 'First booster catch' }),
  mission(6, '19 Nov 2024', 'Controlled Gulf splashdown', 'Controlled Indian Ocean splashdown', { landmark: 'In-space engine relight' }),
  mission(7, '16 Jan 2025', 'Caught by launch tower', 'Lost during ascent', { route: 'ascent', duration: 8, landmark: 'First Block 2 ship' }),
  mission(8, '06 Mar 2025', 'Caught by launch tower', 'Lost during ascent', { route: 'ascent', duration: 8, landmark: 'Third booster catch' }),
  mission(9, '27 May 2025', 'Lost above Gulf of Mexico', 'Lost during reentry', { route: 'indian', duration: 50, landmark: 'First reused booster' }),
  mission(10, '26 Aug 2025', 'Controlled Gulf splashdown', 'Controlled Indian Ocean splashdown', { landmark: 'Return to full profile' }),
  mission(11, '13 Oct 2025', 'Controlled Gulf splashdown', 'Controlled Indian Ocean splashdown', { landmark: 'Final Block 2 flight' }),
  mission(12, '22 May 2026', 'Hard Gulf impact', 'Controlled Indian Ocean splashdown', { landmark: 'First Pad 2 flight', stageSeconds: 144, boosterSeconds: 419 }),
  mission(13, '24 Jul 2026', 'Hard Gulf impact', 'Controlled Indian Ocean splashdown', { landmark: 'First V3 deployment', stageSeconds: 141, boosterSeconds: 413 }),
  mission(14, '28 Sep 2026', 'Controlled Gulf splashdown', 'Controlled Pacific splashdown', { route: 'orbit-pacific', phase: 'Orbital flight', duration: 189, landmark: 'First orbital Starship', stageSeconds: 142, boosterSeconds: 421 }),
  mission(15, '13 Nov 2026', 'Lost offshore after catch abort', 'Caught by launch tower', { route: 'orbit-return', phase: 'Orbital flight', duration: 1353, landmark: 'First ship catch', stageSeconds: 141, boosterSeconds: 395, note: 'The booster diverted offshore; the ship returned to Starbase after approximately 22.5 hours.' }),
];
