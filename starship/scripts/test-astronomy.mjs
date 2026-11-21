import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Body,Equator,Horizon,Illumination,Observer} from 'astronomy-engine';
import {geocentricJ2000,astronomyAt,earthFixedVector,horizontalDirection,subsolarLocation,EARTH_RADIUS_KM,MOON_RADIUS_KM,SUN_RADIUS_KM} from '../src/missionAstronomy.js';
import {LAUNCH_UTC} from '../src/missionConstants.js';
const reference=JSON.parse(fs.readFileSync(new URL('../src/data/horizons-reference.json',import.meta.url)));
const maxErrors={};
for(const body of ['moon','sun']){
  let angular=0,distance=0;
  for(const row of reference.bodies[body]){
    const date=new Date((row.jdUTC-2440587.5)*86400000),actual=geocentricJ2000(date)[body],expected=row.positionKm;
    const dot=actual.reduce((sum,x,i)=>sum+x*expected[i],0)/(Math.hypot(...actual)*Math.hypot(...expected));
    const arcseconds=Math.acos(Math.max(-1,Math.min(1,dot)))*180/Math.PI*3600;
    const km=Math.abs(Math.hypot(...actual)-Math.hypot(...expected));
    assert.ok(arcseconds<5,`${body} direction vs JPL: ${arcseconds} arcseconds`);
    assert.ok(km<(body==='moon'?20:1000),`${body} range vs JPL: ${km} km`);
    angular=Math.max(angular,arcseconds);distance=Math.max(distance,km);
  }
  maxErrors[body]={maxDirectionErrorArcsec:angular,maxRangeErrorKm:distance};
}
const observer=new Observer(25.99683,-97.158038,92.8892);
for(const t of [0,141,5266,26135,74515,81154]){
  const date=new Date(LAUNCH_UTC+t*1000),state=astronomyAt(t);
  for(const body of ['moon','sun']){
    const equ=Equator(body==='moon'?Body.Moon:Body.Sun,date,observer,true,false);
    const horizon=Horizon(date,observer,equ.ra,equ.dec);
    const ours=horizontalDirection(state[body],[t,observer.latitude,observer.longitude,.0928892]);
    const azError=Math.abs(((ours.azimuth-horizon.azimuth+540)%360)-180);
    assert.ok(Math.abs(ours.altitude-horizon.altitude)<.02,`${body} horizon altitude frame`);
    assert.ok(azError<.03,`${body} azimuth frame`);
  }
  const referencePhase=Illumination(Body.Moon,date).phase_fraction;
  assert.ok(Math.abs(state.moonIlluminated-referencePhase)<.0002,'Lunar lit fraction');
  assert.ok(state.moonDistanceKm>350000&&state.moonDistanceKm<410000);
  assert.equal(state.moonRadius,MOON_RADIUS_KM/EARTH_RADIUS_KM);
  assert.equal(state.sunRadius,SUN_RADIUS_KM/EARTH_RADIUS_KM);
  const subsolar=subsolarLocation(t),rad=Math.PI/180;
  const normal=[Math.cos(subsolar[1]*rad)*Math.cos(subsolar[2]*rad),Math.sin(subsolar[1]*rad),-Math.cos(subsolar[1]*rad)*Math.sin(subsolar[2]*rad)];
  const dot=normal.reduce((sum,x,i)=>sum+x*state.sun[i]/Math.hypot(...state.sun),0);
  assert.ok(Math.abs(dot-1)<1e-12,'Subsolar normal directly faces Sun');
  const opposite=normal.map(v=>-v);
  assert.ok(opposite.reduce((s,x,i)=>s+x*state.sun[i],0)<0,'Antipode is on night side');
  const xyz=earthFixedVector([1,2,3],date);
  assert.ok(Math.abs(Math.hypot(...xyz)*EARTH_RADIUS_KM-Math.sqrt(14))<1e-12,'Frame rotation preserves distance');
}
console.log('Astronomy: JPL DE441 vectors, true-of-date/Earth-fixed frame, observer azimuth/elevation, lunar phase, physical radii and day/night geometry passed.');
console.log(JSON.stringify(maxErrors,null,2));
