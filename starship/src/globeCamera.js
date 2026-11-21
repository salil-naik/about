import * as THREE from 'three';
import {xyz,pad as defaultPad} from './flight15Geometry';
import * as defaultDynamics from './globeMission';
import {astronomyAt as defaultAstronomy} from './missionAstronomy';
import {activeReturnCheck as defaultReturnCheck} from './returnRegions';
// A celestial look target describes direction, not the distance to nearby
// geometry. Retain the local horizon even while looking toward a distant body.
export function cameraNearPlane(position,target){
  const height=Math.max(0,position.length()-1);
  return Math.max(1e-9,Math.min(position.distanceTo(target)*.005,height*.05));
}
export function blendCameraPose(a,b,progress){
  const u=THREE.MathUtils.smootherstep(progress,0,1);
  const direction=a.position.clone().normalize(),end=b.position.clone().normalize();
  const turn=new THREE.Quaternion().setFromUnitVectors(direction,end);
  const position=direction.applyQuaternion(new THREE.Quaternion().slerp(turn,u)).multiplyScalar(THREE.MathUtils.lerp(a.position.length(),b.position.length(),u));
  return {position,target:a.target.clone().lerp(b.target,u),up:a.up.clone().lerp(b.up,u).normalize()};
}
// Track the vehicle immediately in a close shot; ease the centre only after
// the camera has pulled back far enough to retain the whole globe.
export function followCameraPose(previous,desired,dt,anchor=false){
 const alpha=1-Math.exp(-Math.min(dt,.1)*5);
 const before=previous.position.clone().sub(previous.target),after=desired.position.clone().sub(desired.target);
 const desiredRange=after.length(),range=THREE.MathUtils.lerp(before.length(),desiredRange,alpha);
 // When following a vehicle, rotate with its ground track immediately. Easing
 // this direction makes its marker race ahead of the route at high replay speed.
 if(anchor)return {target:desired.target.clone(),position:desired.target.clone().add(after.normalize().multiplyScalar(range)),up:desired.up.clone()};
 const turn=new THREE.Quaternion().setFromUnitVectors(before.normalize(),after.normalize());
 const offset=before.applyQuaternion(new THREE.Quaternion().slerp(turn,alpha)).multiplyScalar(range);
 const target=previous.target.clone().lerp(desired.target,THREE.MathUtils.lerp(1,alpha,THREE.MathUtils.smoothstep(desiredRange,.02,.3)));
 return {target,position:target.clone().add(offset),up:previous.up.clone().lerp(desired.up,alpha).normalize()};
}
export function cameraPose(time,followTarget='ship',mission=null,overview=false,compact=false){
  const {shipFix,boosterFix,cameraOrbit,cameraRange,METRE}=mission||defaultDynamics;
  const pad=mission?.pad||defaultPad,astronomyAt=mission?.astronomyAt||defaultAstronomy,activeReturnCheck=mission?.returnCheck||defaultReturnCheck;
  if(overview){const axis=new THREE.Vector3(...xyz(mission?.pad||pad)).normalize();return {target:new THREE.Vector3(),position:axis.multiplyScalar(compact?5.8:2.8),up:new THREE.Vector3(0,1,0)};}
  const booster=followTarget==='booster'&&(mission?mission.boosterAvailable(time):time>=141&&time<407);
  const point=new THREE.Vector3(...xyz(booster?boosterFix(time):shipFix(time)));
  const radial=point.clone().normalize();
  const east=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),radial).normalize();
  const north=new THREE.Vector3().crossVectors(radial,east).normalize();
  const altitude=shipFix(time)[3];
  const orbit=booster?0:cameraOrbit(time);
  const range=booster?(450+boosterFix(time)[3]*2)/6371000:cameraRange(time);
  const globeFocus=booster?0:THREE.MathUtils.smootherstep(range*6371,1000,12000);
  const target=point.clone().addScaledVector(radial,THREE.MathUtils.lerp(14,-12,THREE.MathUtils.smootherstep(time,mission?.shipCatch?mission.end-44:81110,mission?.shipCatch?mission.landing+2:81138))*METRE).multiplyScalar(1-globeFocus);
  const water=mission&&(booster?mission.boosterContactTime!=null&&!mission.boosterCatch:mission.shipContactTime!=null);
  const nearSurface=water?THREE.MathUtils.smootherstep((booster?boosterFix(time):shipFix(time))[3],.1,2):1;
  const elevation=THREE.MathUtils.lerp(.18,.38,nearSurface);
  const direction=radial.clone().multiplyScalar(elevation+.62*orbit).addScaledVector(east,-.85+1.1*orbit).addScaledVector(north,-.32+.47*orbit).normalize();
  const position=target.clone().addScaledVector(direction,range);
  if(!booster&&time<18){
    const groundBlend=1-THREE.MathUtils.smootherstep(time,3,18);
    const site=new THREE.Vector3(...xyz([0,pad[1],pad[2],.002]));
    const ground=site.addScaledVector(east,-.28/6371*.8).addScaledVector(north,-.28/6371*.55);
    position.lerp(ground,groundBlend);
  }
  // A portrait viewport has a much narrower horizontal field of view.
  // Pull back only when the camera is already composing a full-Earth shot.
  if(compact&&altitude>=100&&target.length()<.25&&position.distanceTo(target)<5.8){
    position.sub(target).setLength(5.8).add(target);
  }
  if(followTarget==='moon'||followTarget==='sun'){
    const astro=astronomyAt(time);
    const sightline=new THREE.Vector3(...astro[followTarget]).sub(position).normalize();
    return {target:position.clone().add(sightline),position,up:radial.clone()};
  }
  if(followTarget==='return'){
    const r=activeReturnCheck(time);
    if(r){const axis=new THREE.Vector3(...xyz([0,r.lat,r.lon,0])).normalize();return {target:new THREE.Vector3(),position:axis.multiplyScalar(compact?5.8:3),up:new THREE.Vector3(0,1,0)};}
  }
  return {target,position,up:radial.clone().lerp(new THREE.Vector3(0,1,0),orbit).normalize()};
}
