import React,{useMemo,useEffect} from 'react';
import * as THREE from 'three';
import {useMission} from './MissionContext';
import {xyz} from './flight15Geometry';
function WaterContact({time,contact,fix,hard=false}){
 const {METRE}=useMission();
 const frame=useMemo(()=>{
  const up=new THREE.Vector3(...xyz([0,fix[1],fix[2],0])).normalize();
  const east=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),up).normalize(),south=new THREE.Vector3().crossVectors(east,up).normalize();
  return {origin:up.clone(),rotation:new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(east,up,south))};
 },[fix[1],fix[2]]);
 const geometry=useMemo(()=>{
  const g=new THREE.PlaneGeometry(14000,14000,48,48);g.rotateX(-Math.PI/2);const p=g.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,-(x*x+z*z)/12742000+.02);colors.push(1,1,1,1-THREE.MathUtils.smoothstep(Math.hypot(x,z),3000,6900));}
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,4));g.computeVertexNormals();return g;
 },[]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 const age=time-contact;
 const spray=Array.from({length:14},(_,i)=>{const angle=i*2.39996,p=THREE.MathUtils.clamp(age/(hard?5:4),0,1),r=(hard?55:17)*p*(.5+(i%4)/4);return {x:Math.cos(angle)*r,z:Math.sin(angle)*r,y:Math.max(0,(hard?60:13)*Math.sin(Math.PI*p)*(.4+i%3/3)),size:(hard?8:3)*(1+2*p),opacity:(1-p)*.16};});
 return <group position={frame.origin} quaternion={frame.rotation} scale={METRE}>
  <mesh geometry={geometry} receiveShadow><meshStandardMaterial color="#365b68" roughness={.94} metalness={0} emissive="#19323b" emissiveIntensity={.12} onBeforeCompile={shader=>{
    shader.vertexShader='varying vec3 waterPoint;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n waterPoint=position;');
    shader.fragmentShader='varying vec3 waterPoint;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb*=.97+.035*sin(waterPoint.x*.10+waterPoint.z*.17)*sin(waterPoint.x*.023-waterPoint.z*.04);');
   }} vertexColors transparent depthWrite={false}/></mesh>
  {Array.from({length:7},(_,i)=><mesh key={'wave'+i} rotation={[-Math.PI/2,0,.18]} position={[0,.13,-180-i*150]} scale={[3,1,1]}><ringGeometry args={[120+i*13,120.3+i*13,96,1,0,Math.PI*.8]}/><meshBasicMaterial color="#91b4be" transparent opacity={.055} depthWrite={false}/></mesh>)}
  {age>=0&&age<15&&<>
   {[0,1.5,3].map((delay,i)=>{const a=Math.max(0,age-delay),radius=5+a*(hard?28:15);return age>=delay&&<mesh key={'ripple'+i} rotation={[-Math.PI/2,0,0]} position={[0,.2+i*.02,0]}><ringGeometry args={[radius,radius+1.3,96]}/><meshBasicMaterial color="#c2d5d8" transparent opacity={Math.max(0,.24-a*.021)} depthWrite={false}/></mesh>;})}
   {spray.map((p,i)=><mesh key={i} position={[p.x,p.y+.4,p.z]} scale={[p.size,p.size*.7,p.size]}><sphereGeometry args={[1,8,6]}/><meshBasicMaterial color="#dce6e5" transparent opacity={p.opacity} depthWrite={false}/></mesh>)}
  </>}
 </group>;
}
export default function Splashdown({time}){
 const m=useMission(),ship=m.shipContactTime,booster=m.boosterContactTime;
 return <>
  {ship!=null&&time>=ship-90&&<WaterContact time={time} contact={ship} fix={m.shipFix(ship)}/>}
  {booster!=null&&!m.boosterCatch&&time>=booster-55&&time<booster+12&&<WaterContact time={time} contact={booster} fix={m.boosterFix(booster)} hard={m.boosterOutcomeType==='impact'}/>}
 </>;
}
