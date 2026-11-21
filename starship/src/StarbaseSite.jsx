import React,{useEffect,useMemo} from 'react';
import * as THREE from 'three';
import site from './data/starbase-osm.json';

function Feature({feature}){
  const {tags,points,closed}=feature;
  const building=Boolean(tags.building)&&!tags.aeroway;
  // The active tower is drawn separately with movable catch arms.
  const tower=tags.man_made==='tower';
  const geometry=useMemo(()=>{
    if(tower||!building&&tags.man_made!=='pipeline')return null;
    if(closed&&points.length>3){
      const shape=new THREE.Shape(points.map(([east,north])=>new THREE.Vector2(east,north)));
      const h=building?Math.min(40,Math.max(2,parseFloat(tags.height)||6)):.18;
      const g=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false});
      g.rotateX(-Math.PI/2);g.translate(0,.15,0);return g;
    }
    const curve=new THREE.CurvePath();
    for(let i=1;i<points.length;i++)curve.add(new THREE.LineCurve3(new THREE.Vector3(points[i-1][0],.35,-points[i-1][1]),new THREE.Vector3(points[i][0],.35,-points[i][1])));
    const width=tags.highway?(tags.highway==='service'?2:3.5):.35;
    return new THREE.TubeGeometry(curve,Math.min(600,points.length*3),width,4,false);
  },[feature]);
  const edges=useMemo(()=>geometry&&building?new THREE.EdgesGeometry(geometry,25):null,[geometry,building]);
  useEffect(()=>()=>{geometry?.dispose();edges?.dispose();},[geometry,edges]);
  if(!geometry)return null;
  const water=tags.natural==='water'||tags.natural==='coastline';
  const color=building?'#b2b7af':water?'#294554':tags.highway?'#7b7c72':tags.landuse==='industrial'||tags['area:highway']?'#66685e':tags.natural==='scrub'?'#4c5a51':'#777769';
  return <group><mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial roughness={.8} metalness={.08} color={color} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-1}/></mesh>{edges&&<lineSegments geometry={edges}><lineBasicMaterial color="#a9b3ad" transparent opacity={.14}/></lineSegments>}</group>;
}
function Tank({feature}){
  const layout=useMemo(()=>{
    const points=feature.points.map(([x,n])=>new THREE.Vector2(x,-n));
    let axis=new THREE.Vector2(1,0),longest=0;
    for(let i=1;i<points.length;i++){const d=points[i].clone().sub(points[i-1]);if(d.lengthSq()>longest){longest=d.lengthSq();axis=d.normalize();}}
    const side=new THREE.Vector2(-axis.y,axis.x),along=points.map(p=>p.dot(axis)),across=points.map(p=>p.dot(side));
    const lo=Math.min(...along),hi=Math.max(...along),left=Math.min(...across),right=Math.max(...across);
    const center=axis.clone().multiplyScalar((lo+hi)/2).addScaledVector(side,(left+right)/2);
    const r=(right-left)/2,length=hi-lo;
    return {center,r:Math.max(.5,r),length,vertical:length<r*3,axis:new THREE.Vector3(axis.x,0,axis.y)};
  },[feature]);
  const {center,r,length,axis,vertical}=layout;
  const height=Number(feature.tags.height)||Math.max(7,r*3);
  const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis);
  return <group position={[center.x,0,center.y]}>
    <mesh receiveShadow position={[0,.25,0]}><boxGeometry args={[r*2.2,.5,Math.max(length,2*r)]}/><meshStandardMaterial color="#959c92" roughness={.95}/></mesh>
    <mesh castShadow receiveShadow position={[0,vertical?height/2:r+.7,0]} quaternion={vertical?undefined:rotation}>
      {vertical?<cylinderGeometry args={[r,r,height,24]}/>:<capsuleGeometry args={[r,Math.max(.1,length-2*r),5,24]}/>}
      <meshStandardMaterial color="#c8d0ca" roughness={.5} metalness={.2}/>
    </mesh>
  </group>;
}
export default function StarbaseSite(){
  const sorted=useMemo(()=>[...site.features].filter(f=>f.tags.man_made!=='gantry'&&Number(f.tags.layer||0)>=0).sort((a,b)=>Number(Boolean(a.tags.building))-Number(Boolean(b.tags.building))),[]);
  return <group>{sorted.map(feature=>feature.tags.man_made==='storage_tank'?<Tank key={feature.id} feature={feature}/>:<Feature key={feature.id} feature={feature}/>)}</group>;
}
