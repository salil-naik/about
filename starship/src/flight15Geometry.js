import recording from './data/flight15.json';
import {LAUNCH_UTC,EARTH_RADIUS_KM} from './missionConstants';
import {subsolarLocation} from './missionAstronomy';
export const samples = recording.samples;
export const earthKm = EARTH_RADIUS_KM;
export function missionDate(t) {return new Date(LAUNCH_UTC+t*1000);}
export const subsolarPoint=subsolarLocation;
export const pad = [-10.584, 25.99683, -97.158038, .0928892];
export const dimensions = {ship:52.1, booster:72.3, diameter:9, tower:144.5};
export const layers = [
  {name:'Troposphere',low:0,high:12}, {name:'Stratosphere',low:12,high:50},
  {name:'Mesosphere',low:50,high:85}, {name:'Thermosphere',low:85,high:600},
];
export function fixIndex(t){
  let lo=0,hi=samples.length;
  while(lo<hi){const m=(lo+hi)>>>1;if(samples[m][0]<=t)lo=m+1;else hi=m;}
  return lo-1;
}
const shortArc=(a,b)=>((b-a+540)%360)-180;
function monotoneSlope(before,after,dtBefore,dtAfter){
  if(before*after<=0)return 0;
  const w1=2*dtAfter+dtBefore,w2=dtAfter+2*dtBefore;
  return (w1+w2)/(w1/before+w2/after);
}
// C1 monotone Hermite interpolation passes through every source fix, avoids
// overshoot, and never bridges a telemetry gap longer than 90 seconds.
export function interpolateTrack(t,track=samples,origin=pad){
  if(t<=0)return [t,origin[1],origin[2],origin[3]];
  let lo=0,hi=track.length;
  while(lo<hi){const m=(lo+hi)>>>1;if(track[m][0]<=t)lo=m+1;else hi=m;}
  const i=lo-1,a=i<0?[0,...origin.slice(1)]:track[i],b=track[i+1];
  if(!b||b[0]-a[0]>90)return a;
  const dt=b[0]-a[0],u=Math.max(0,Math.min(1,(t-a[0])/dt));
  const previous=i===0?[0,...origin.slice(1)]:track[i-1],next=track[i+2];
  const result=[t];
  for(let column=1;column<=3;column++){
    const av=a[column],bv=column===2?av+shortArc(av,b[column]):b[column];
    const secant=(bv-av)/dt;
    let left=0,right=0;
    if(previous&&a[0]>previous[0]&&a[0]-previous[0]<=90){
      const dp=a[0]-previous[0],pv=column===2?av-shortArc(previous[column],av):previous[column];
      left=monotoneSlope((av-pv)/dp,secant,dp,dt);
    }
    if(next&&next[0]-b[0]<=90){
      const dn=next[0]-b[0],nv=column===2?bv+shortArc(b[column],next[column]):next[column];
      right=monotoneSlope(secant,(nv-bv)/dn,dt,dn);
    }
    const value=(2*u*u*u-3*u*u+1)*av+(u*u*u-2*u*u+u)*dt*left+(-2*u*u*u+3*u*u)*bv+(u*u*u-u*u)*dt*right;
    result.push(column===2?((value+540)%360)-180:value);
  }
  return result;
}
export function positionAt(t){return interpolateTrack(t);}
export function xyz(point){
  const [,lat,lon,h]=point, rad=Math.PI/180,r=1+h/earthKm,c=Math.cos(lat*rad);
  return [r*c*Math.cos(lon*rad),r*Math.sin(lat*rad),-r*c*Math.sin(lon*rad)];
}
