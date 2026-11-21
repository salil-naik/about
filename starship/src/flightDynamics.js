import * as THREE from 'three';
import {earthKm,xyz,interpolateTrack} from './flight15Geometry';
export function createFlightDynamics(config){
const {pad,samples,dimensions}=config;
const METRE=1/(earthKm*1000);
const SEPARATION=config.stageSeconds;
const CATCH=config.end;
const SHIP_REFERENCE=12; // illustrated antenna reference above the ship base, metres
// Align only the final settled sample with the published catch milestone.
// This terminal timing is a reconstruction, not additional measured telemetry.
const positionTrack=config.number===13?[...samples,[config.shipContactTime,samples.at(-1)[1],samples.at(-1)[2],.012]]:samples;
const catchTrack=positionTrack.map((fix,i)=>config.shipCatch&&i===samples.length-1?[CATCH,...fix.slice(1)]:fix);
function shipFix(time){
 const fix=[...interpolateTrack(time,catchTrack,pad)];fix[0]=time;
 if(config.shipContactTime!=null&&time>config.shipContactTime){const tip=smooth(time,config.shipContactTime+1,config.shipContactTime+11)*Math.PI*.47;fix[3]=.012*Math.cos(tip);}
 return fix;
}
const cubic=(a,b,m0,m1,u)=>a*(2*u**3-3*u*u+1)+m0*(u**3-2*u*u+u)+b*(-2*u**3+3*u*u)+m1*(u**3-u*u);
const smooth=(t,a,b)=>THREE.MathUtils.smootherstep(t,a,b);
function shipAxis(time){
  const fix=shipFix(time),radial=new THREE.Vector3(...xyz(fix)).normalize();
  if(config.shipContactTime!=null&&time>=config.shipContactTime){
   const east=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),radial).normalize();
   return radial.multiplyScalar(Math.cos(smooth(time,config.shipContactTime+1,config.shipContactTime+11)*Math.PI*.47)).addScaledVector(east,Math.sin(smooth(time,config.shipContactTime+1,config.shipContactTime+11)*Math.PI*.47)).normalize();
  }
  if(time<=30||(config.shipCatch&&time>=CATCH))return radial;
  const velocity=new THREE.Vector3(...xyz(shipFix(time+.5))).sub(new THREE.Vector3(...xyz(shipFix(time-.5))));
  if(velocity.lengthSq()<1e-18)return radial;
  let axis=velocity.normalize();
  if(time>=config.entry){
    const horizontal=axis.clone().addScaledVector(radial,-axis.dot(radial));
    if(horizontal.lengthSq()>1e-12)axis=horizontal.normalize();
    axis.lerp(radial,smooth(time,config.landing+2,config.landing+10)).normalize();
    return axis;
  }
  const q=new THREE.Quaternion().setFromUnitVectors(radial,axis);
  return radial.applyQuaternion(new THREE.Quaternion().slerp(q,smooth(fix[3],2,80)));
}
function shipOrigin(time){
 const fix=shipFix(time),axis=shipAxis(time),radial=new THREE.Vector3(...xyz(fix)).normalize();
 // Render the hull against the waterline without changing a recorded GPS fix.
 const height=config.shipContactTime!=null?Math.max(fix[3],.012*axis.dot(radial)):fix[3];
 return new THREE.Vector3(...xyz([time,fix[1],fix[2],height])).addScaledVector(axis,-SHIP_REFERENCE*METRE);
}
function attachedBoosterCenter(time){return shipOrigin(time).addScaledVector(shipAxis(time),-dimensions.booster/2*METRE);}
function vectorFix(time,p){const r=p.length();return [time,Math.asin(p.y/r)*180/Math.PI,Math.atan2(-p.z,p.x)*180/Math.PI,(r-1)*earthKm];}
// No measured booster track exists. Preserve the actual rendered attachment
// point and its derivative, then reconstruct an offshore return with zero
// terminal velocity. Both stage origins stay continuous while the stack tilts.
const splitCenter=attachedBoosterCenter(config.stage?SEPARATION:config.end);
const splitMotion=attachedBoosterCenter((config.stage?SEPARATION:config.end)+.01).sub(attachedBoosterCenter((config.stage?SEPARATION:config.end)-.01)).multiplyScalar(50);
const destination=new THREE.Vector3(...xyz([config.boosterSeconds,pad[1]-(config.boosterCatch?0:.12),pad[2]+(config.boosterCatch?0:.6),dimensions.booster/2000+(config.boosterCatch?.060:config.historical?.5:0)]));
const boostTrack=config.boosterSamples;
const boostInitial=boostTrack?new THREE.Vector3(...xyz(interpolateTrack(SEPARATION,boostTrack,pad))):null;
const boostOffset=boostInitial?splitCenter.clone().sub(boostInitial):null;
function boosterFix(time){
  if(!config.stage||time<=SEPARATION)return vectorFix(time,attachedBoosterCenter(time));
  if(boostTrack){
   const p=new THREE.Vector3(...xyz(interpolateTrack(time,boostTrack,pad))).addScaledVector(boostOffset,1-smooth(time,SEPARATION,SEPARATION+15));
   if(config.boosterContactTime!=null&&config.boosterOutcomeType==='splashdown'&&time>config.boosterContactTime){const r=p.clone().normalize();p.copy(r).multiplyScalar(1+dimensions.booster/2*METRE*Math.cos(smooth(time,config.boosterContactTime+1,config.boosterContactTime+11)*Math.PI*.47));}
   return vectorFix(time,p);
  }
  const duration=config.boosterSeconds-SEPARATION,u=Math.min(1,(time-SEPARATION)/duration);
  const p=new THREE.Vector3(...['x','y','z'].map(c=>cubic(splitCenter[c],destination[c],splitMotion[c]*duration,0,u)));
  return vectorFix(time,p);
}
function boosterAxis(time){
  if(!config.stage)return shipAxis(time);
  const initial=shipAxis(SEPARATION),radial=new THREE.Vector3(...xyz(boosterFix(time))).normalize();
  if(config.boosterContactTime!=null&&config.boosterOutcomeType==='splashdown'&&time>=config.boosterContactTime){const east=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),radial).normalize(),angle=smooth(time,config.boosterContactTime+1,config.boosterContactTime+11)*Math.PI*.47;return radial.multiplyScalar(Math.cos(angle)).addScaledVector(east,Math.sin(angle)).normalize();}
  const horizontal=initial.clone().addScaledVector(radial,-initial.dot(radial)).normalize();
  const retrograde=horizontal.multiplyScalar(-.96).addScaledVector(radial,.28).normalize();
  const flip=new THREE.Quaternion().setFromUnitVectors(initial,retrograde);
  const axis=initial.clone().applyQuaternion(new THREE.Quaternion().slerp(flip,smooth(time,SEPARATION,SEPARATION+23)));
  const upright=new THREE.Quaternion().setFromUnitVectors(axis,radial);
  return axis.applyQuaternion(new THREE.Quaternion().slerp(upright,smooth(time,Math.min(SEPARATION+49,config.boosterSeconds-12),Math.max(SEPARATION+50,config.boosterSeconds-65))));
}
function boosterOrigin(time){return new THREE.Vector3(...xyz(boosterFix(time))).addScaledVector(boosterAxis(time),-dimensions.booster/2*METRE);}
function vehicleBase(fix,offset=SHIP_REFERENCE){return xyz([fix[0],fix[1],fix[2],Math.max(0,fix[3]-offset/1000)]);}
function cameraOrbit(time){
  const altitude=shipFix(time)[3];
  const u=Math.min(1,Math.max(0,(altitude-35)/120));
  const altitudeBlend=u*u*(3-2*u);
  const v=Math.min(1,Math.max(0,(time-(config.stageSeconds+12))/100));
  return altitudeBlend*(time<config.cutoff?v*v*(3-2*v):1);
}
function cameraRange(time){
  const altitude=Math.max(0,shipFix(time)[3]-.105);
  const orbit=cameraOrbit(time);
  const launchRange=.28+.14*Math.min(1,Math.max(0,time)/30)+altitude*.002;
  const descentRange=Math.hypot(.42,(Math.sqrt(altitude+.09)-.3)*1.4);
  let close=Math.exp(THREE.MathUtils.lerp(Math.log(launchRange),Math.log(descentRange),smooth(time,config.cutoff-30,config.cutoff+30)));
  if(config.shipCatch&&time>=CATCH-26){const u=Math.min(1,(time-(CATCH-26))/26);close*=1-.43*u*u*(3-2*u);}
  // Geometric distance interpolation retains the vehicle for the opening part
  // of the pullback; a linear 0.5→19,000 km ramp loses it almost instantly.
  return Math.exp(THREE.MathUtils.lerp(Math.log(close),Math.log(19000),orbit))/earthKm;
}
const physicalDimensions={...dimensions,earthRadius:earthKm*1000};

return {METRE,SEPARATION,CATCH,SHIP_REFERENCE,shipFix,shipAxis,shipOrigin,boosterFix,boosterAxis,boosterOrigin,vehicleBase,cameraOrbit,cameraRange,physicalDimensions};
}
