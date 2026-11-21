import {Body,GeoMoon,HelioVector,RotateVector,Rotation_EQJ_EQD,SiderealTime,Vector} from 'astronomy-engine';
import {LAUNCH_UTC,EARTH_RADIUS_KM,MOON_RADIUS_KM,SUN_RADIUS_KM,AU_KM} from './missionConstants.js';
export {EARTH_RADIUS_KM,MOON_RADIUS_KM,SUN_RADIUS_KM};
const rad=Math.PI/180;
export function geocentricJ2000(date){
  const moon=GeoMoon(date),earth=HelioVector(Body.Earth,date);
  return {moon:[moon.x*AU_KM,moon.y*AU_KM,moon.z*AU_KM],sun:[-earth.x*AU_KM,-earth.y*AU_KM,-earth.z*AU_KM]};
}
// J2000 -> true equator/equinox of date -> Earth-fixed. Scene Y is north,
// X is Greenwich and negative Z is 90 E. UTC approximates UT1 (under 0.9 s).
export function earthFixedVector(vectorKm,date){
  const v=RotateVector(Rotation_EQJ_EQD(date),new Vector(...vectorKm,date));
  const theta=SiderealTime(date)*15*rad,c=Math.cos(theta),s=Math.sin(theta);
  return [(v.x*c+v.y*s)/EARTH_RADIUS_KM,v.z/EARTH_RADIUS_KM,(v.x*s-v.y*c)/EARTH_RADIUS_KM];
}
const cache=new Map();
function sample(second,epoch){
  const key=epoch+second*1000;
  if(cache.has(key))return cache.get(key);
  const date=new Date(key),vectors=geocentricJ2000(date);
  const result={sun:earthFixedVector(vectors.sun,date),moon:earthFixedVector(vectors.moon,date)};
  cache.set(key,result);if(cache.size>256)cache.delete(cache.keys().next().value);
  return result;
}
export function astronomyAt(time,epoch=LAUNCH_UTC){
  const low=Math.floor(time/10)*10,u=(time-low)/10,a=sample(low,epoch),b=sample(low+10,epoch);
  const lerp=(key)=>a[key].map((x,i)=>x+(b[key][i]-x)*u);
  const sun=lerp('sun'),moon=lerp('moon');
  const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=v=>Math.hypot(...v);
  const moonToSun=sun.map((x,i)=>x-moon[i]),moonToEarth=moon.map(x=>-x);
  const phaseCos=dot(moonToSun,moonToEarth)/(norm(moonToSun)*norm(moonToEarth));
  return {sun,moon,sunDistanceKm:norm(sun)*EARTH_RADIUS_KM,moonDistanceKm:norm(moon)*EARTH_RADIUS_KM,moonIlluminated:(1+phaseCos)/2,moonRadius:MOON_RADIUS_KM/EARTH_RADIUS_KM,sunRadius:SUN_RADIUS_KM/EARTH_RADIUS_KM};
}
export function horizontalDirection(body,fix){
  const [,lat,lon,height]=fix,a=lat*rad,b=lon*rad;
  const up=[Math.cos(a)*Math.cos(b),Math.sin(a),-Math.cos(a)*Math.sin(b)];
  const east=[-Math.sin(b),0,-Math.cos(b)],north=[-Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];
  const observer=up.map(x=>x*(1+height/EARTH_RADIUS_KM));
  const delta=body.map((x,i)=>x-observer[i]),length=Math.hypot(...delta);
  const dot=v=>v.reduce((sum,x,i)=>sum+x*delta[i],0);
  return {azimuth:((Math.atan2(dot(east),dot(north))/rad)%360+360)%360,altitude:Math.asin(Math.max(-1,Math.min(1,dot(up)/length)))/rad};
}
export function subsolarLocation(time,epoch=LAUNCH_UTC){
  const {sun}=astronomyAt(time,epoch),r=Math.hypot(...sun);
  return [time,Math.asin(sun[1]/r)/rad,Math.atan2(-sun[2],sun[0])/rad,0];
}
