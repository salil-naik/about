import * as THREE from 'three';
import {xyz,pad} from './flight15Geometry';
import {shipOrigin,shipAxis,CATCH,METRE} from './globeMission';
export const CATCH_PIN_HEIGHT=32.5; // representative side lifting pins, not flight CAD
export const CATCH_PIN_HALF_HEIGHT=.225;
export const ARM_HALF_HEIGHT=.75;
export const TOWER_POSITION=new THREE.Vector3(-3.2,0,-25.7);
const up=new THREE.Vector3(0,1,0);
export const siteUp=new THREE.Vector3(...xyz(pad)).normalize();
export const siteEast=new THREE.Vector3().crossVectors(up,siteUp).normalize();
export const siteSouth=new THREE.Vector3().crossVectors(siteUp,siteEast).negate().normalize();
export const siteOrigin=new THREE.Vector3(...xyz([0,pad[1],pad[2],0]));
export const siteRotation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(siteEast,siteUp,siteSouth));
const catchOffset=shipOrigin(CATCH).sub(siteOrigin).multiplyScalar(1/METRE);
export const catchPosition=new THREE.Vector3(catchOffset.dot(siteEast),catchOffset.dot(siteUp),catchOffset.dot(siteSouth));
const approach=catchPosition.clone().sub(TOWER_POSITION);
export const armYaw=-Math.atan2(approach.z,approach.x);
export const pinDirection=siteEast.clone().multiplyScalar(Math.sin(armYaw)).addScaledVector(siteSouth,Math.cos(armYaw)).normalize();
export function catchMechanism(time){
  const supportHeight=catchPosition.y+CATCH_PIN_HEIGHT-CATCH_PIN_HALF_HEIGHT;
  return {
    height:THREE.MathUtils.lerp(125,supportHeight-ARM_HALF_HEIGHT,THREE.MathUtils.smootherstep(time,81110,81140)),
    gap:THREE.MathUtils.lerp(8,5.5,THREE.MathUtils.smootherstep(time,81147,81153)),
  };
}
export function shipRotation(time){
  const axis=shipAxis(time),rotation=new THREE.Quaternion().setFromUnitVectors(up,axis);
  const x=pinDirection.clone().addScaledVector(axis,-pinDirection.dot(axis)).normalize();
  const z=new THREE.Vector3().crossVectors(x,axis).normalize();
  const aligned=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,axis,z));
  return rotation.slerp(aligned,THREE.MathUtils.smootherstep(time,81110,81138));
}

export function createSite(mission){
 const local=world=>{const d=world.clone().sub(siteOrigin).multiplyScalar(1/mission.METRE);return new THREE.Vector3(d.dot(siteEast),d.dot(siteUp),d.dot(siteSouth));};
 const launchPosition=local(new THREE.Vector3(...xyz([0,mission.pad[1],mission.pad[2],0])));
 const towerPosition=launchPosition.clone().add(new THREE.Vector3(-3.2,0,-25.7));
 const catchTime=mission.shipCatch?mission.end:mission.boosterCatch?mission.boosterSeconds:Infinity;
 const support=mission.shipCatch?local(mission.shipOrigin(mission.end)):mission.boosterCatch?local(mission.boosterOrigin(mission.boosterSeconds)):launchPosition.clone().setY(93);
 const pinHeight=mission.shipCatch?CATCH_PIN_HEIGHT:mission.dimensions.booster*66.5/72.3;
 const delta=support.clone().sub(towerPosition),yaw=-Math.atan2(delta.z,delta.x);
 const pinAxis=siteEast.clone().multiplyScalar(Math.sin(yaw)).addScaledVector(siteSouth,Math.cos(yaw)).normalize();
 function rotation(axis,t,a,b){
  const q=new THREE.Quaternion().setFromUnitVectors(up,axis);
  const x=pinAxis.clone().addScaledVector(axis,-pinAxis.dot(axis)).normalize(),z=new THREE.Vector3().crossVectors(x,axis).normalize();
  return q.slerp(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,axis,z)),THREE.MathUtils.smootherstep(t,a,b));
 }
 return {siteOrigin,siteUp,siteEast,siteSouth,siteRotation,launchPosition,TOWER_POSITION:towerPosition,armYaw:yaw,catchTime,
  catchMechanism:t=>({height:THREE.MathUtils.lerp(125,support.y+pinHeight-CATCH_PIN_HALF_HEIGHT-ARM_HALF_HEIGHT,THREE.MathUtils.smootherstep(t,catchTime-44,catchTime-14)),gap:THREE.MathUtils.lerp(8,5.5,THREE.MathUtils.smootherstep(t,catchTime-7,catchTime-1))}),
  shipRotation:t=>rotation(mission.shipAxis(t),t,mission.shipCatch?mission.end-44:Infinity,mission.shipCatch?mission.landing+2:Infinity),
  boosterRotation:t=>rotation(mission.boosterAxis(t),t,mission.boosterCatch?mission.boosterSeconds-30:Infinity,mission.boosterCatch?mission.boosterSeconds-5:Infinity),
 };
}
